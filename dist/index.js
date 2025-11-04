const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    pid: process.pid,
    project: 'adgenxai'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AdGenXAI GitHub Agent Server',
    project: 'adgenxai',
    port: port,
    status: 'running',
    endpoints: {
      health: '/health',
      webhook: '/webhook',
      status: '/'
    }
  });
});

// GitHub webhook endpoint for adgenxai
app.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event'];
  console.log('📥 AdGenXAI Webhook received:', event);
  
  // Log webhook details
  console.log('🔍 Event:', event);
  console.log('🔍 Repository:', req.body?.repository?.full_name);
  console.log('🔍 Action:', req.body?.action);
  
  res.json({ 
    message: 'AdGenXAI webhook received successfully',
    event: event,
    repository: req.body?.repository?.full_name,
    processed: true
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AdGenXAI GitHub Agent Server Running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Dashboard: http://localhost:${port}/`);
  console.log(`Repository: brandonlacoste9-tech/adgenxai`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 AdGenXAI GitHub Agent shutting down gracefully...');
  process.exit(0);
});