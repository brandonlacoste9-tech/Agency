module.exports = {
  apps: [{
    name: 'github-pr-manager',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // 24/7 Operation Configuration
    autorestart: true,
    max_restarts: 50,        // Increased from 10
    min_uptime: '10s',
    max_memory_restart: '500M',
    restart_delay: 4000,     // 4 second delay between restarts
    
    // Logging for 24/7 monitoring
    log_file: './logs/github-agent.log',
    error_file: './logs/github-agent-error.log',
    out_file: './logs/github-agent-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced 24/7 settings
    watch: false,            // Don't restart on file changes
    ignore_watch: ['logs', 'node_modules'],
    kill_timeout: 5000,      // 5 seconds to gracefully shut down
    listen_timeout: 3000,    // 3 seconds to start listening
    
    // Cron restart for daily maintenance
    cron_restart: '0 3 * * *',  // Restart daily at 3 AM
    
    // Health monitoring
    health_check_grace_period: 10000
  }]
};