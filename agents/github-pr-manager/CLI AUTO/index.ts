/**
 * GitHub PR Manager Agent System
 * Main entry point for the multi-agent GitHub automation system
 */

import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Status endpoint
app.get('/status', (_req, res) => {
  res.json({
    service: 'GitHub PR Manager Agent',
    status: 'operational',
    agents: {
      total: 6,
      active: 0,
      busy: 0
    },
    tasks: {
      pending: 0,
      running: 0,
      completed: 0
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/agents', (_req, res) => {
  res.json({
    agents: [
      { id: 'security', name: 'Security Agent', status: 'offline', endpoint: process.env['SECURITY_AGENT_ENDPOINT'] },
      { id: 'code-review', name: 'Code Review Agent', status: 'offline', endpoint: process.env['CODE_REVIEW_AGENT_ENDPOINT'] },
      { id: 'testing', name: 'Testing Agent', status: 'offline', endpoint: process.env['TESTING_AGENT_ENDPOINT'] },
      { id: 'documentation', name: 'Documentation Agent', status: 'offline', endpoint: process.env['DOCUMENTATION_AGENT_ENDPOINT'] },
      { id: 'performance', name: 'Performance Agent', status: 'offline', endpoint: process.env['PERFORMANCE_AGENT_ENDPOINT'] },
      { id: 'deployment', name: 'Deployment Agent', status: 'offline', endpoint: process.env['DEPLOYMENT_AGENT_ENDPOINT'] }
    ]
  });
});

app.get('/api/tasks', (_req, res) => {
  res.json({
    tasks: [],
    total: 0,
    pending: 0,
    running: 0,
    completed: 0
  });
});

// GitHub webhook endpoint (placeholder)
app.post('/webhook/github', (req, res) => {
  console.log('GitHub webhook received:', req.headers['x-github-event']);
  
  // Basic webhook validation would go here
  const event = req.headers['x-github-event'];
  
  // For now, just acknowledge receipt
  res.status(200).json({ 
    message: 'Webhook received', 
    event,
    processed: false,
    reason: 'Agent system in development mode'
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GitHub PR Manager Agent System starting...`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`);
  console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
  console.log(`🪝 Webhook: http://localhost:${PORT}/webhook/github`);
  console.log(`⚙️  Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log('');
  console.log('💡 Quick Start:');
  console.log('   curl http://localhost:3000/health');
  console.log('   curl http://localhost:3000/status');
  console.log('');
  console.log('🔧 For PR triage, use: npm run triage:prs -- --repo owner/repo');
});

export default app;