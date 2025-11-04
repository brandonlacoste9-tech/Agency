#!/usr/bin/env node

const axios = require('axios');

// Simulate GitHub webhook events
const testWebhooks = [
  {
    event: 'pull_request',
    action: 'opened',
    repository: {
      full_name: 'brandonlacoste9-tech/adgenxai',
      name: 'adgenxai'
    },
    pull_request: {
      number: 123,
      title: 'Test PR for GitHub Agent',
      user: { login: 'test-user' }
    }
  },
  {
    event: 'push',
    ref: 'refs/heads/main',
    repository: {
      full_name: 'brandonlacoste9-tech/adgenxai',
      name: 'adgenxai'
    },
    commits: [
      {
        id: 'abc123',
        message: 'Test commit for GitHub Agent',
        author: { name: 'Test User' }
      }
    ]
  },
  {
    event: 'issues',
    action: 'opened',
    repository: {
      full_name: 'brandonlacoste9-tech/adgenxai',
      name: 'adgenxai'
    },
    issue: {
      number: 456,
      title: 'Test issue for GitHub Agent',
      user: { login: 'test-user' }
    }
  }
];

async function testGitHubAgent() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing GitHub Agent webhooks...\n');
  
  // Test health endpoint first
  try {
    console.log('🔍 Checking agent health...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Agent is healthy:', healthResponse.data.status);
    console.log(`📊 Project: ${healthResponse.data.project}`);
    console.log(`⏱️  Uptime: ${Math.round(healthResponse.data.uptime)}s\n`);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('💡 Make sure GitHub Agent is running: npm run agent:deploy\n');
    return;
  }
  
  // Test webhook endpoints
  for (let i = 0; i < testWebhooks.length; i++) {
    const webhook = testWebhooks[i];
    
    try {
      console.log(`📥 Testing webhook ${i + 1}: ${webhook.event} - ${webhook.action || 'default'}`);
      
      const response = await axios.post(`${baseUrl}/webhook`, webhook, {
        headers: {
          'X-GitHub-Event': webhook.event,
          'Content-Type': 'application/json',
          'X-GitHub-Delivery': `test-delivery-${Date.now()}`
        }
      });
      
      console.log('✅ Webhook processed:', response.data.message);
      console.log(`🔍 Event: ${response.data.event}, Repository: ${response.data.repository}\n`);
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Webhook ${i + 1} failed:`, error.message, '\n');
    }
  }
  
  console.log('🎉 Webhook testing complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check PM2 logs: npm run agent:status');
  console.log('2. View detailed health: npm run agent:health');
  console.log('3. Set up real GitHub webhooks in repository settings');
}

// Run the test
testGitHubAgent().catch(console.error);