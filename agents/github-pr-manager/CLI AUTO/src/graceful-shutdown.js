import { drainQueue, cleanup as cleanupQueue } from './backpressure-control.js';

let shuttingDown = false;
let server = null;

export function setServer(httpServer) {
  server = httpServer;
}

export async function gracefulShutdown(signal = 'UNKNOWN') {
  if (shuttingDown) {
    console.warn('Shutdown already in progress, ignoring signal:', signal);
    return;
  }
  
  shuttingDown = true;
  console.info(`🛑 Graceful shutdown initiated (signal: ${signal})`);
  
  const shutdownTimeout = setTimeout(() => {
    console.error('⏰ Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout for graceful shutdown

  try {
    // 1. Stop accepting new HTTP requests
    if (server) {
      console.info('📡 Closing HTTP server...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.info('✅ HTTP server closed');
    }

    // 2. Drain the webhook processing queue
    console.info('🔄 Draining webhook queue...');
    await drainQueue();
    console.info('✅ Webhook queue drained');

    // 3. Close Redis and other connections
    console.info('🔌 Cleaning up connections...');
    await cleanupQueue();
    console.info('✅ Connections cleaned up');

    // 4. Clear shutdown timeout
    clearTimeout(shutdownTimeout);
    
    console.info('🎯 Graceful shutdown completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Install signal handlers
export function installShutdownHandlers() {
  // Handle SIGTERM (Docker/Kubernetes graceful shutdown)
  process.on('SIGTERM', () => {
    console.info('Received SIGTERM');
    gracefulShutdown('SIGTERM');
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.info('Received SIGINT');
    gracefulShutdown('SIGINT');
  });

  // Handle uncaught exceptions gracefully
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught exception:', error);
    await gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled promise rejection:', reason);
    console.error('Promise:', promise);
    await gracefulShutdown('UNHANDLED_REJECTION');
  });

  console.info('🛡️ Graceful shutdown handlers installed');
}

// Health check for shutdown status
export function isShuttingDown() {
  return shuttingDown;
}