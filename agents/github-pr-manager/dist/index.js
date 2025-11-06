const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 GitHub Agent Server',
    port: port,
    endpoints: { health: '/health', webhook: '/webhook' }
  });
});

app.post('/webhook', (req, res) => {
  console.log('📥 Webhook:', req.headers['x-github-event']);
  res.json({ message: 'Webhook received' });
});

app.listen(port, () => {
  console.log(`🚀 GitHub Agent Server Running on port ${port}`);
});
