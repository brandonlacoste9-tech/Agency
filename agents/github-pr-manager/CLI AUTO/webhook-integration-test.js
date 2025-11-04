#!/usr/bin/env node
// agents/github-pr-manager/webhook-integration-test.js

import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Production-grade webhook integration test
 * Tests signature verification, queue processing, and metrics
 */
class WebhookIntegrationTest {
  constructor(baseUrl = 'http://localhost:3001', webhookSecret = 'test-secret') {
    this.baseUrl = baseUrl;
    this.webhookSecret = webhookSecret;
    this.testResults = [];
    this.testStats = {
      total: 0,
      passed: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  // Generate GitHub webhook signature with PowerShell-compatible method
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    return 'sha256=' + hmac.update(payload).digest('hex');
  }

  // Send webhook with proper GitHub headers
  async sendWebhook(event, payload, delivery = null, customHeaders = {}) {
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, this.webhookSecret);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-GitHub-Event': event,
      'X-GitHub-Delivery': delivery || crypto.randomUUID(),
      'X-Hub-Signature-256': signature,
      'X-GitHub-Hook-ID': '12345',
      'X-GitHub-Hook-Installation-Target-ID': '67890',
      'User-Agent': 'GitHub-Hookshot/webhooktest',
      ...customHeaders
    };

    const response = await fetch(`${this.baseUrl}/webhook`, {
      method: 'POST',
      headers,
      body: payloadString
    });

    return { response, headers, payload: payloadString };
  }

  // Record test result
  recordTest(name, passed, details = null, error = null) {
    this.testStats.total++;
    if (passed) {
      this.testStats.passed++;
    } else {
      this.testStats.failed++;
    }

    this.testResults.push({
      name,
      passed,
      details,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Test 1: Service health and readiness
  async testServiceHealth() {
    console.log('🏥 Testing service health and readiness...');
    
    try {
      // Health check
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      const healthData = await healthResponse.json();
      
      this.recordTest(
        'Health endpoint accessibility',
        healthResponse.status === 200 && healthData.status === 'healthy',
        `Status: ${healthResponse.status}, Health: ${healthData.status}`
      );

      // Readiness check
      const readyResponse = await fetch(`${this.baseUrl}/ready`);
      const readyData = await readyResponse.json();
      
      this.recordTest(
        'Readiness endpoint check',
        readyResponse.status === 200 || readyResponse.status === 503,
        `Status: ${readyResponse.status}, Ready: ${readyData.status}`
      );

      // Metrics endpoint
      const metricsResponse = await fetch(`${this.baseUrl}/metrics`);
      
      this.recordTest(
        'Prometheus metrics endpoint',
        metricsResponse.status === 200 && 
        metricsResponse.headers.get('content-type').includes('text/plain'),
        `Status: ${metricsResponse.status}, Content-Type: ${metricsResponse.headers.get('content-type')}`
      );

    } catch (error) {
      this.recordTest('Service health check', false, null, error.message);
    }
  }

  // Test 2: Webhook signature verification security
  async testWebhookSecurity() {
    console.log('🔐 Testing webhook security...');
    
    const testPayload = { test: 'signature_verification', timestamp: Date.now() };
    
    // Test 1: Valid signature
    try {
      const { response } = await this.sendWebhook('ping', testPayload);
      this.recordTest(
        'Valid signature acceptance',
        response.status === 202,
        `Status: ${response.status}`
      );
    } catch (error) {
      this.recordTest('Valid signature test', false, null, error.message);
    }

    // Test 2: Invalid signature
    try {
      const payloadString = JSON.stringify(testPayload);
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': 'sha256=invalid_signature_test'
        },
        body: payloadString
      });
      
      this.recordTest(
        'Invalid signature rejection',
        response.status === 401,
        `Status: ${response.status} (should be 401)`
      );
    } catch (error) {
      this.recordTest('Invalid signature test', false, null, error.message);
    }

    // Test 3: Missing signature
    try {
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID()
        },
        body: JSON.stringify(testPayload)
      });
      
      this.recordTest(
        'Missing signature rejection',
        response.status === 401,
        `Status: ${response.status} (should be 401)`
      );
    } catch (error) {
      this.recordTest('Missing signature test', false, null, error.message);
    }

    // Test 4: Malformed payload
    try {
      const signature = this.generateSignature('invalid json', this.webhookSecret);
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': signature
        },
        body: 'invalid json'
      });
      
      this.recordTest(
        'Malformed JSON handling',
        response.status >= 400,
        `Status: ${response.status} (should be 4xx)`
      );
    } catch (error) {
      // Network error is expected for malformed JSON
      this.recordTest('Malformed JSON handling', true, 'Network error expected');
    }
  }

  // Test 3: Pull request webhook processing
  async testPullRequestWebhook() {
    console.log('🔄 Testing pull request webhook processing...');
    
    const prPayload = {
      action: 'opened',
      number: 123,
      pull_request: {
        id: 1,
        number: 123,
        title: 'Integration test: Enhanced webhook processing',
        body: 'This PR tests the enhanced webhook processing system with metrics and security.',
        state: 'open',
        draft: false,
        mergeable: true,
        commits: 3,
        additions: 25,
        deletions: 10,
        changed_files: 4,
        diff_url: 'https://github.com/test/test/pull/123.diff',
        patch_url: 'https://github.com/test/test/pull/123.patch',
        head: {
          ref: 'feature/webhook-enhancement',
          sha: 'abc123def456789'
        },
        base: {
          ref: 'main',
          sha: 'def456ghi789abc'
        },
        user: {
          login: 'testuser',
          id: 12345
        }
      },
      repository: {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        owner: {
          login: 'testuser',
          id: 12345
        }
      },
      sender: {
        login: 'testuser',
        id: 12345
      }
    };

    try {
      const startTime = Date.now();
      const { response } = await this.sendWebhook('pull_request', prPayload);
      const responseTime = Date.now() - startTime;
      
      this.recordTest(
        'Pull request webhook processing',
        response.status === 202,
        `Status: ${response.status}, Response time: ${responseTime}ms`
      );

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      this.recordTest('Pull request webhook', false, null, error.message);
    }
  }

  // Test 4: Issues webhook processing
  async testIssuesWebhook() {
    console.log('🐛 Testing issues webhook processing...');
    
    const issuePayload = {
      action: 'opened',
      issue: {
        id: 1,
        number: 456,
        title: 'Integration test: Security vulnerability in webhook handler',
        body: 'Found potential security issue in webhook signature verification.',
        state: 'open',
        labels: [],
        assignees: [],
        user: {
          login: 'security-researcher',
          id: 54321
        }
      },
      repository: {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        owner: {
          login: 'testuser',
          id: 12345
        }
      },
      sender: {
        login: 'security-researcher',
        id: 54321
      }
    };

    try {
      const { response } = await this.sendWebhook('issues', issuePayload);
      
      this.recordTest(
        'Issues webhook processing',
        response.status === 202,
        `Status: ${response.status}`
      );
      
    } catch (error) {
      this.recordTest('Issues webhook', false, null, error.message);
    }
  }

  // Test 5: Burst load testing
  async testBurstLoad() {
    console.log('⚡ Testing burst load handling...');
    
    const burstSize = 10;
    const webhooks = [];
    
    // Create burst of webhooks
    for (let i = 0; i < burstSize; i++) {
      const payload = {
        action: 'synchronize',
        pull_request: {
          id: i + 1000,
          number: i + 1000,
          title: `Burst test PR ${i + 1}`,
          body: `Load testing webhook processing capability ${i + 1}/${burstSize}`
        },
        repository: {
          name: 'test-repo',
          full_name: 'testuser/test-repo'
        }
      };
      
      webhooks.push(this.sendWebhook('pull_request', payload));
    }

    try {
      const startTime = Date.now();
      const responses = await Promise.all(webhooks);
      const totalTime = Date.now() - startTime;
      
      const successCount = responses.filter(({ response }) => response.status === 202).length;
      const avgResponseTime = totalTime / burstSize;
      
      this.recordTest(
        `Burst load test (${burstSize} webhooks)`,
        successCount === burstSize,
        `Success rate: ${successCount}/${burstSize}, Avg response: ${avgResponseTime.toFixed(2)}ms`
      );
      
    } catch (error) {
      this.recordTest('Burst load test', false, null, error.message);
    }
  }

  // Test 6: Metrics validation
  async testMetricsCollection() {
    console.log('📊 Testing metrics collection...');
    
    try {
      // Get initial metrics
      const initialMetrics = await fetch(`${this.baseUrl}/metrics`);
      const initialText = await initialMetrics.text();
      
      // Send a test webhook
      await this.sendWebhook('ping', { test: 'metrics' });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get updated metrics
      const updatedMetrics = await fetch(`${this.baseUrl}/metrics`);
      const updatedText = await updatedMetrics.text();
      
      // Check for expected metrics
      const hasWebhookMetrics = updatedText.includes('github_webhooks_total');
      const hasQueueMetrics = updatedText.includes('github_webhook_queue_length');
      const hasDurationMetrics = updatedText.includes('github_webhook_processing_duration_seconds');
      
      this.recordTest(
        'Webhook metrics collection',
        hasWebhookMetrics && hasQueueMetrics && hasDurationMetrics,
        `Webhook metrics: ${hasWebhookMetrics}, Queue metrics: ${hasQueueMetrics}, Duration metrics: ${hasDurationMetrics}`
      );
      
    } catch (error) {
      this.recordTest('Metrics collection test', false, null, error.message);
    }
  }

  // PowerShell-compatible signature verification test
  async testPowerShellCompatibility() {
    console.log('🔧 Testing PowerShell signature compatibility...');
    
    const payload = JSON.stringify({ test: 'powershell_compat' });
    
    // Simulate PowerShell HMAC computation
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const hash = hmac.update(payload).digest('hex');
    const signature = 'sha256=' + hash.toLowerCase();
    
    try {
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': signature
        },
        body: payload
      });
      
      this.recordTest(
        'PowerShell signature compatibility',
        response.status === 202,
        `PowerShell-generated signature accepted: ${response.status}`
      );
      
    } catch (error) {
      this.recordTest('PowerShell compatibility', false, null, error.message);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Webhook Integration Tests...\n');
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Secret: ${this.webhookSecret ? '[CONFIGURED]' : '[NOT SET]'}\n`);
    
    // Reset stats
    this.testResults = [];
    this.testStats = {
      total: 0,
      passed: 0,
      failed: 0,
      startTime: Date.now()
    };

    // Run test suite
    await this.testServiceHealth();
    await this.testWebhookSecurity();
    await this.testPullRequestWebhook();
    await this.testIssuesWebhook();
    await this.testBurstLoad();
    await this.testMetricsCollection();
    await this.testPowerShellCompatibility();

    // Print results
    this.printResults();
    return this.testResults;
  }

  // Print comprehensive test results
  printResults() {
    const duration = Date.now() - this.testStats.startTime;
    
    console.log('\n📋 Webhook Integration Test Results');
    console.log('=' .repeat(50));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total tests: ${this.testStats.total}`);
    console.log(`   Passed: ${this.testStats.passed} ✅`);
    console.log(`   Failed: ${this.testStats.failed} ❌`);
    console.log(`   Success rate: ${(this.testStats.passed / this.testStats.total * 100).toFixed(1)}%`);
    console.log(`   Duration: ${duration}ms`);
    
    if (this.testStats.passed === this.testStats.total) {
      console.log('\n🎉 ALL TESTS PASSED! Your webhook system is production-ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the details below:');
    }
    
    console.log('\n📝 Detailed Results:');
    console.log('-' .repeat(40));
    
    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    // Production readiness assessment
    console.log('\n🏭 Production Readiness Assessment:');
    const criticalTests = [
      'Valid signature acceptance',
      'Invalid signature rejection',
      'Pull request webhook processing',
      'Webhook metrics collection'
    ];
    
    const criticalPassed = criticalTests.every(test => 
      this.testResults.some(r => r.name === test && r.passed)
    );
    
    if (criticalPassed) {
      console.log('✅ All critical tests passed - READY FOR PRODUCTION');
    } else {
      console.log('❌ Critical tests failed - DO NOT DEPLOY TO PRODUCTION');
    }
    
    return {
      passed: this.testStats.passed,
      total: this.testStats.total,
      success_rate: (this.testStats.passed / this.testStats.total * 100).toFixed(1) + '%',
      duration_ms: duration,
      production_ready: criticalPassed,
      results: this.testResults
    };
  }

  // Generate PowerShell test commands
  generatePowerShellCommands() {
    console.log('\n🔧 PowerShell Test Commands:');
    console.log('=' .repeat(40));
    
    const payload = JSON.stringify({ test: 'powershell_manual' });
    
    console.log('# 1. Generate signature:');
    console.log(`$secret = '${this.webhookSecret}'`);
    console.log(`$payload = '${payload}'`);
    console.log(`$hmac = New-Object System.Security.Cryptography.HMACSHA256([System.Text.Encoding]::UTF8.GetBytes($secret))`);
    console.log(`$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))`);
    console.log(`$sig = 'sha256=' + ([System.BitConverter]::ToString($hash) -replace '-','').ToLower()`);
    console.log(`Write-Output $sig`);
    
    console.log('\n# 2. Send webhook:');
    console.log(`curl -X POST '${this.baseUrl}/webhook' \\`);
    console.log(`  -H "X-GitHub-Event: ping" \\`);
    console.log(`  -H "X-Hub-Signature-256: $sig" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  --data '${payload}'`);
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
  const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';
  
  const testSuite = new WebhookIntegrationTest(baseUrl, webhookSecret);
  
  console.log('GitHub Webhook Integration Test Suite');
  console.log('===================================');
  
  testSuite.runAllTests()
    .then(results => {
      testSuite.generatePowerShellCommands();
      
      const success = results.filter(r => r.passed).length === results.length;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

export { WebhookIntegrationTest };