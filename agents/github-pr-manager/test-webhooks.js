#!/usr/bin/env node
// agents/github-pr-manager/test-webhooks.js

import { WebhookTestSuite } from './src/webhook-test-suite.js';

async function runTests() {
  console.log('🧪 GitHub Webhook Integration Tests');
  console.log('====================================\n');

  // Get configuration from environment or use defaults
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
  const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';

  console.log(`Testing against: ${baseUrl}`);
  console.log(`Using webhook secret: ${webhookSecret ? '[CONFIGURED]' : '[NOT SET]'}\n`);

  // Create test suite
  const testSuite = new WebhookTestSuite(baseUrl, webhookSecret);

  try {
    // Run all tests
    const results = await testSuite.runAllTests();
    
    // Exit with appropriate code
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    if (passed === total) {
      console.log('\n🎉 All webhook tests passed!');
      process.exit(0);
    } else {
      console.log(`\n❌ ${total - passed} tests failed.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test suite failed to run:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
GitHub Webhook Test Suite

Usage: npm run test:webhooks [options]

Environment Variables:
  TEST_BASE_URL     Base URL for webhook endpoint (default: http://localhost:3001)
  WEBHOOK_SECRET    Webhook secret for signature verification (default: test-secret)

Options:
  --help, -h        Show this help message

Examples:
  npm run test:webhooks
  TEST_BASE_URL=http://localhost:3001 npm run test:webhooks
  WEBHOOK_SECRET=my-secret npm run test:webhooks
`);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});