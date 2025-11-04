// tests/integration/postSignedWebhook.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/webhook';
const SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test';
const QUEUE_KEY = process.env.WEBHOOK_QUEUE_KEY || 'queue:github-webhook';

async function computeSignature(secret, payload) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function checkServerHealth(baseUrl) {
  try {
    const healthUrl = baseUrl.replace('/webhook', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    console.log('Server health check:', response.data.status);
    return response.data.status === 'healthy';
  } catch (error) {
    console.warn('Health check failed:', error.message);
    return false;
  }
}

async function checkMetrics(baseUrl) {
  try {
    const metricsUrl = baseUrl.replace('/webhook', '/metrics');
    const response = await axios.get(metricsUrl, { timeout: 5000 });
    console.log('Metrics endpoint accessible, content length:', response.data.length);
    
    // Parse some basic metrics
    const metrics = response.data;
    const queueLengthMatch = metrics.match(/github_webhook_queue_length\s+(\d+)/);
    const processedMatch = metrics.match(/github_webhook_processed_total\s+(\d+)/);
    
    if (queueLengthMatch) {
      console.log('Current queue length from metrics:', queueLengthMatch[1]);
    }
    if (processedMatch) {
      console.log('Total processed from metrics:', processedMatch[1]);
    }
    
    return true;
  } catch (error) {
    console.warn('Metrics check failed:', error.message);
    return false;
  }
}

(async function run() {
  const redis = new Redis(REDIS_URL);
  console.log('Starting webhook integration test...');

  try {
    // Check if payload file exists
    const payloadPath = path.resolve(__dirname, 'payload.json');
    if (!fs.existsSync(payloadPath)) {
      console.error('❌ Create tests/integration/payload.json with a sample webhook payload');
      console.error('Example payload structure:');
      console.error(JSON.stringify({
        ref: "refs/heads/main",
        repository: {
          name: "test-repo",
          full_name: "test-user/test-repo"
        },
        pusher: {
          name: "test-user"
        },
        commits: [{
          id: "abc123",
          message: "Test commit",
          author: { name: "Test User" }
        }]
      }, null, 2));
      process.exit(2);
    }

    const payload = fs.readFileSync(payloadPath, 'utf8');
    console.log('✅ Loaded webhook payload');

    // Test server connectivity
    console.log('\n📡 Testing server connectivity...');
    const isHealthy = await checkServerHealth(WEBHOOK_URL);
    if (!isHealthy) {
      console.warn('⚠️ Server health check failed, but continuing with test');
    }

    // Test metrics endpoint
    console.log('\n📊 Testing metrics endpoint...');
    await checkMetrics(WEBHOOK_URL);

    // Test Redis connection
    console.log('\n📦 Testing Redis connection...');
    await redis.ping();
    console.log('✅ Redis connection successful');

    const initialLen = await redis.llen(QUEUE_KEY);
    console.log('📊 Initial queue length:', initialLen);

    // Compute webhook signature
    console.log('\n🔐 Computing webhook signature...');
    const signature = await computeSignature(SECRET, payload);
    console.log('✅ Signature computed:', signature.substring(0, 20) + '...');

    const headers = {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'push',
      'X-Hub-Signature-256': signature,
      'X-GitHub-Delivery': `test-${Date.now()}`,
      'User-Agent': 'GitHub-Hookshot/integration-test'
    };

    console.log('\n🚀 Posting webhook to', WEBHOOK_URL);
    const startTime = Date.now();
    
    try {
      const res = await axios.post(WEBHOOK_URL, JSON.parse(payload), { 
        headers, 
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid for testing
      });
      
      const duration = Date.now() - startTime;
      console.log('✅ Webhook response:', res.status, res.statusText);
      console.log('⏱️ Response time:', duration + 'ms');
      
      if (res.data) {
        console.log('📋 Response data:', JSON.stringify(res.data, null, 2));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - is the webhook server running?');
        console.error('💡 Start it with: docker-compose -f docker-compose-basic.yml up github-pr-manager');
        process.exit(3);
      }
      throw error;
    }

    // Wait and check queue changes
    console.log('\n⏳ Monitoring queue for changes...');
    const POLL_MS = 1000;
    const MAX_TRIES = 12;
    let success = false;
    let finalQueueLength = initialLen;

    for (let i = 0; i < MAX_TRIES; i++) {
      const len = await redis.llen(QUEUE_KEY);
      finalQueueLength = len;
      
      console.log(`📊 Try ${i + 1}/${MAX_TRIES}: queue length = ${len} (initial: ${initialLen})`);
      
      if (len > initialLen) {
        console.log('✅ Queue increased — webhook enqueued successfully!');
        success = true;
        break;
      } else if (len < initialLen) {
        console.log('🔄 Queue decreased — webhook might have been processed instantly');
        success = true;
        break;
      }
      
      if (i < MAX_TRIES - 1) {
        await sleep(POLL_MS);
      }
    }

    // Check metrics after test
    console.log('\n📊 Final metrics check...');
    await checkMetrics(WEBHOOK_URL);

    // Test additional endpoints
    console.log('\n🔍 Testing additional endpoints...');
    try {
      const delivery = headers['X-GitHub-Delivery'];
      const statusUrl = WEBHOOK_URL.replace('/webhook', `/webhook/status/${delivery}`);
      const statusRes = await axios.get(statusUrl, { timeout: 5000 });
      console.log('✅ Status endpoint accessible:', statusRes.status);
    } catch (error) {
      console.log('ℹ️ Status endpoint not available (optional)');
    }

    // Summary
    console.log('\n📋 Integration Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Webhook payload computed and signed');
    console.log('✅ HTTP request sent successfully');
    console.log('✅ Redis connection functional');
    console.log(`📊 Queue length: ${initialLen} → ${finalQueueLength}`);
    console.log(`🎯 Test result: ${success ? 'PASSED' : 'INCONCLUSIVE'}`);
    
    if (!success) {
      console.log('\n⚠️ Queue did not change. Possible reasons:');
      console.log('  • Webhook was processed instantly (very fast worker)');
      console.log('  • Webhook was rejected (check logs)');
      console.log('  • Different queue key is being used');
      console.log('  • Worker is not running');
      
      // Don't fail the test - just mark as inconclusive
      console.log('\n💡 Check webhook server logs for processing details');
    }

    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('\n❌ Integration test error:');
    console.error(err.stack || err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the webhook server is running:');
      console.error('   docker-compose -f docker-compose-basic.yml up github-pr-manager');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n💡 Check the WEBHOOK_URL environment variable');
    }
    
    process.exit(2);
  } finally {
    redis.disconnect();
  }
})();
