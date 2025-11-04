import { setAgentsEnabled, isAgentsEnabled, getQueueStats } from './backpressure-control.js';
import { getDeadLetterStats, clearDeadLetterQueue } from './webhook-circuit-breaker.js';
import { isShuttingDown } from './graceful-shutdown.js';

// Admin authentication middleware
function requireAuth(req, res, next) {
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (!expectedToken) {
    return res.status(500).json({ 
      error: 'Admin token not configured',
      message: 'Set ADMIN_TOKEN environment variable'
    });
  }
  
  if (!authToken || authToken !== expectedToken) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid admin token required'
    });
  }
  
  next();
}

// Setup admin routes
export function setupAdminRoutes(app) {
  
  // Agent control endpoints
  app.post('/admin/agents/enable', requireAuth, async (req, res) => {
    try {
      await setAgentsEnabled(true);
      res.json({ 
        success: true, 
        message: 'Agents enabled',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to enable agents:', error);
      res.status(500).json({ 
        error: 'Failed to enable agents',
        message: error.message
      });
    }
  });

  app.post('/admin/agents/disable', requireAuth, async (req, res) => {
    try {
      await setAgentsEnabled(false);
      res.json({ 
        success: true, 
        message: 'Agents disabled',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to disable agents:', error);
      res.status(500).json({ 
        error: 'Failed to disable agents',
        message: error.message
      });
    }
  });

  app.get('/admin/agents/status', requireAuth, async (req, res) => {
    try {
      const enabled = await isAgentsEnabled();
      const queueStats = getQueueStats();
      const deadLetterStats = getDeadLetterStats();
      
      res.json({
        agents: {
          enabled,
          status: enabled ? 'active' : 'disabled'
        },
        queue: queueStats,
        deadLetter: deadLetterStats,
        system: {
          shuttingDown: isShuttingDown(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to get agent status:', error);
      res.status(500).json({ 
        error: 'Failed to get agent status',
        message: error.message
      });
    }
  });

  // Dead letter queue management
  app.post('/admin/dead-letter/clear', requireAuth, async (req, res) => {
    try {
      const clearedCount = clearDeadLetterQueue();
      res.json({
        success: true,
        message: `Cleared ${clearedCount} items from dead letter queue`,
        clearedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to clear dead letter queue:', error);
      res.status(500).json({
        error: 'Failed to clear dead letter queue',
        message: error.message
      });
    }
  });

  app.get('/admin/dead-letter', requireAuth, async (req, res) => {
    try {
      const deadLetterStats = getDeadLetterStats();
      res.json(deadLetterStats);
    } catch (error) {
      console.error('Failed to get dead letter stats:', error);
      res.status(500).json({
        error: 'Failed to get dead letter stats',
        message: error.message
      });
    }
  });

  // Health check endpoint (no auth required)
  app.get('/admin/health', (req, res) => {
    res.json({
      status: isShuttingDown() ? 'shutting-down' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown'
    });
  });

  console.info('🔐 Admin endpoints configured');
  console.info('Available endpoints:');
  console.info('  POST /admin/agents/enable');
  console.info('  POST /admin/agents/disable');
  console.info('  GET  /admin/agents/status');
  console.info('  POST /admin/dead-letter/clear');
  console.info('  GET  /admin/dead-letter');
  console.info('  GET  /admin/health');
  
  if (!process.env.ADMIN_TOKEN) {
    console.warn('⚠️  ADMIN_TOKEN not set - admin endpoints will be inaccessible');
  }
}
