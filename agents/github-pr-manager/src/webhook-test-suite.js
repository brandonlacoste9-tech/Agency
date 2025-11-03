// agents/github-pr-manager/src/webhook-test-suite.js
import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Comprehensive webhook testing suite for GitHub PR Manager
 * Tests webhook signature verification, event routing, and processing
 */
export class WebhookTestSuite {
  constructor(baseUrl = 'http://localhost:3001', webhookSecret = 'test-secret') {
    this.baseUrl = baseUrl;
    this.webhookSecret = webhookSecret;
    this.testResults = [];
  }

  // Generate GitHub webhook signature
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    return 'sha256=' + hmac.update(payload).digest('hex');
  }

  // Send webhook with proper signature
  async sendWebhook(event, payload, delivery = null) {
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, this.webhookSecret);
    
    const response = await fetch(`${this.baseUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': event,
        'X-GitHub-Delivery': delivery || crypto.randomUUID(),
        'X-Hub-Signature-256': signature,
        'X-GitHub-Hook-ID': '12345',
        'X-GitHub-Hook-Installation-Target-ID': '67890',
        'User-Agent': 'GitHub-Hookshot/webhooktest'
      },
      body: payloadString
    });

    return response;
  }

  // Test webhook signature verification
  async testSignatureVerification() {
    console.log('🔐 Testing webhook signature verification...');
    
    const testPayload = { test: 'signature_verification' };
    const payloadString = JSON.stringify(testPayload);
    
    // Test 1: Valid signature
    try {
      const validResponse = await this.sendWebhook('ping', testPayload);
      const validResult = validResponse.status === 202;
      this.testResults.push({
        test: 'Valid signature verification',
        passed: validResult,
        status: validResponse.status,
        details: validResult ? 'Webhook accepted with valid signature' : 'Failed to accept valid signature'
      });
    } catch (error) {
      this.testResults.push({
        test: 'Valid signature verification',
        passed: false,
        error: error.message
      });
    }

    // Test 2: Invalid signature
    try {
      const invalidResponse = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': 'sha256=invalid_signature'
        },
        body: payloadString
      });
      
      const invalidResult = invalidResponse.status === 401;
      this.testResults.push({
        test: 'Invalid signature rejection',
        passed: invalidResult,
        status: invalidResponse.status,
        details: invalidResult ? 'Invalid signature properly rejected' : 'Failed to reject invalid signature'
      });
    } catch (error) {
      this.testResults.push({
        test: 'Invalid signature rejection',
        passed: false,
        error: error.message
      });
    }

    // Test 3: Missing signature
    try {
      const missingResponse = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID()
        },
        body: payloadString
      });
      
      const missingResult = missingResponse.status === 401;
      this.testResults.push({
        test: 'Missing signature rejection',
        passed: missingResult,
        status: missingResponse.status,
        details: missingResult ? 'Missing signature properly rejected' : 'Failed to reject missing signature'
      });
    } catch (error) {
      this.testResults.push({
        test: 'Missing signature rejection',
        passed: false,
        error: error.message
      });
    }
  }

  // Test pull request webhook processing
  async testPullRequestWebhook() {
    console.log('🔄 Testing pull request webhook processing...');
    
    const prPayload = {
      action: 'opened',
      number: 123,
      pull_request: {
        id: 1,
        number: 123,
        title: 'Test PR for webhook processing',
        body: 'This is a test pull request to verify webhook processing functionality.',
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
          ref: 'feature/test-branch',
          sha: 'abc123def456'
        },
        base: {
          ref: 'main',
          sha: 'def456ghi789'
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
      const response = await this.sendWebhook('pull_request', prPayload);
      const result = response.status === 202;
      
      // Check response body
      const responseBody = await response.json();
      
      this.testResults.push({
        test: 'Pull request webhook processing',
        passed: result,
        status: response.status,
        details: result ? 'PR webhook processed successfully' : 'Failed to process PR webhook',
        response: responseBody
      });
      
      // Wait a moment for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      this.testResults.push({
        test: 'Pull request webhook processing',
        passed: false,
        error: error.message
      });
    }
  }

  // Test issues webhook processing
  async testIssuesWebhook() {
    console.log('🐛 Testing issues webhook processing...');
    
    const issuePayload = {
      action: 'opened',
      issue: {
        id: 1,
        number: 456,
        title: 'Test issue for webhook processing',
        body: 'This is a test issue to verify webhook processing functionality.',
        state: 'open',
        labels: [],
        assignees: [],
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
      const response = await this.sendWebhook('issues', issuePayload);
      const result = response.status === 202;
      
      const responseBody = await response.json();
      
      this.testResults.push({
        test: 'Issues webhook processing',
        passed: result,
        status: response.status,
        details: result ? 'Issue webhook processed successfully' : 'Failed to process issue webhook',
        response: responseBody
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Issues webhook processing',
        passed: false,
        error: error.message
      });
    }
  }

  // Test push webhook processing
  async testPushWebhook() {
    console.log('📤 Testing push webhook processing...');
    
    const pushPayload = {
      ref: 'refs/heads/main',
      before: 'abc123def456',
      after: 'def456ghi789',
      commits: [
        {
          id: 'def456ghi789',
          message: 'Test commit for webhook processing',
          author: {
            name: 'Test User',
            email: 'test@example.com'
          },
          modified: ['file1.js', 'file2.js'],
          added: ['file3.js'],
          removed: []
        }
      ],
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
      const response = await this.sendWebhook('push', pushPayload);
      const result = response.status === 202;
      
      const responseBody = await response.json();
      
      this.testResults.push({
        test: 'Push webhook processing',
        passed: result,
        status: response.status,
        details: result ? 'Push webhook processed successfully' : 'Failed to process push webhook',
        response: responseBody
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Push webhook processing',
        passed: false,
        error: error.message
      });
    }
  }

  // Test webhook status endpoints
  async testStatusEndpoints() {
    console.log('📊 Testing webhook status endpoints...');
    
    // Test webhook status endpoint
    try {
      const statusResponse = await fetch(`${this.baseUrl}/webhook/status`);
      const statusResult = statusResponse.status === 200;
      const statusData = await statusResponse.json();
      
      this.testResults.push({
        test: 'Webhook status endpoint',
        passed: statusResult,
        status: statusResponse.status,
        details: statusResult ? 'Status endpoint accessible' : 'Status endpoint failed',
        data: statusData
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Webhook status endpoint',
        passed: false,
        error: error.message
      });
    }

    // Test health endpoint
    try {
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      const healthResult = healthResponse.status === 200;
      const healthData = await healthResponse.json();
      
      this.testResults.push({
        test: 'Health endpoint',
        passed: healthResult,
        status: healthResponse.status,
        details: healthResult ? 'Health endpoint accessible' : 'Health endpoint failed',
        data: healthData
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Health endpoint',
        passed: false,
        error: error.message
      });
    }
  }

  // Test error handling
  async testErrorHandling() {
    console.log('❌ Testing error handling...');
    
    // Test malformed JSON
    try {
      const malformedResponse = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': this.generateSignature('invalid json', this.webhookSecret)
        },
        body: 'invalid json'
      });
      
      const malformedResult = malformedResponse.status >= 400;
      this.testResults.push({
        test: 'Malformed JSON handling',
        passed: malformedResult,
        status: malformedResponse.status,
        details: malformedResult ? 'Malformed JSON properly rejected' : 'Failed to handle malformed JSON'
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Malformed JSON handling',
        passed: true, // Network error is expected
        details: 'Network error expected for malformed JSON'
      });
    }

    // Test missing event header
    try {
      const missingEventResponse = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Delivery': crypto.randomUUID(),
          'X-Hub-Signature-256': this.generateSignature('{}', this.webhookSecret)
        },
        body: '{}'
      });
      
      const missingEventResult = missingEventResponse.status === 400;
      this.testResults.push({
        test: 'Missing event header handling',
        passed: missingEventResult,
        status: missingEventResponse.status,
        details: missingEventResult ? 'Missing event header properly handled' : 'Failed to handle missing event header'
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Missing event header handling',
        passed: false,
        error: error.message
      });
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting GitHub Webhook Test Suite...\n');
    
    this.testResults = [];
    
    await this.testSignatureVerification();
    await this.testPullRequestWebhook();
    await this.testIssuesWebhook();
    await this.testPushWebhook();
    await this.testStatusEndpoints();
    await this.testErrorHandling();
    
    this.printResults();
    return this.testResults;
  }

  // Print test results
  printResults() {
    console.log('\n📋 Test Results Summary:');
    console.log('=' * 50);
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`\n✅ Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Your webhook system is working correctly.');
    } else {
      console.log('❌ Some tests failed. Check the details below:');
    }
    
    console.log('\nDetailed Results:');
    console.log('-' * 30);
    
    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);
      
      if (result.status) {
        console.log(`   Status: ${result.status}`);
      }
      
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });
    
    return {
      passed,
      total,
      success_rate: (passed / total * 100).toFixed(1) + '%',
      results: this.testResults
    };
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new WebhookTestSuite();
  testSuite.runAllTests().catch(console.error);
}