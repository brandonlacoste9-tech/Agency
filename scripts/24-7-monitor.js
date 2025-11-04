#!/usr/bin/env node

// 24/7 Health Monitor for GitHub Agent
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class HealthMonitor {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.logDir = 'logs';
    this.healthLog = path.join(this.logDir, 'health-monitor.log');
    this.alertThresholds = {
      memory: 400 * 1024 * 1024,  // 400MB
      uptime: 60,                 // 60 seconds minimum
      responseTime: 5000          // 5 seconds max response
    };
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
      await fs.appendFile(this.healthLog, logEntry);
    } catch (error) {
      console.error('Failed to write to log:', error.message);
    }
    
    // Also log to console with colors
    const colors = {
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m'  // Green
    };
    
    console.log(`${colors[level] || ''}[${timestamp}] ${message}\x1b[0m`);
  }

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { 
        timeout: this.alertThresholds.responseTime 
      });
      const responseTime = Date.now() - startTime;
      
      const health = response.data;
      
      // Check various health metrics
      const checks = {
        status: health.status === 'healthy',
        uptime: health.uptime > this.alertThresholds.uptime,
        memory: health.memory.heapUsed < this.alertThresholds.memory,
        responseTime: responseTime < this.alertThresholds.responseTime
      };
      
      const allHealthy = Object.values(checks).every(check => check);
      
      if (allHealthy) {
        await this.log(
          `✅ All systems healthy - Uptime: ${Math.round(health.uptime)}s, ` +
          `Memory: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB, ` +
          `Response: ${responseTime}ms`, 
          'SUCCESS'
        );
      } else {
        const issues = Object.entries(checks)
          .filter(([, passed]) => !passed)
          .map(([check]) => check)
          .join(', ');
          
        await this.log(`⚠️  Health issues detected: ${issues}`, 'WARN');
      }
      
      return { healthy: allHealthy, checks, health, responseTime };
      
    } catch (error) {
      await this.log(`❌ Health check failed: ${error.message}`, 'ERROR');
      return { healthy: false, error: error.message };
    }
  }

  async checkPM2Status() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('npx pm2 jlist');
      const processes = JSON.parse(stdout);
      
      const githubAgent = processes.find(p => p.name === 'github-pr-manager');
      
      if (!githubAgent) {
        await this.log('❌ GitHub Agent process not found in PM2', 'ERROR');
        return { running: false, reason: 'Process not found' };
      }
      
      const isOnline = githubAgent.pm2_env.status === 'online';
      
      if (isOnline) {
        await this.log(
          `✅ PM2 process healthy - PID: ${githubAgent.pid}, ` +
          `Restarts: ${githubAgent.pm2_env.restart_time}, ` +
          `Uptime: ${githubAgent.pm2_env.pm_uptime}`, 
          'INFO'
        );
      } else {
        await this.log(
          `⚠️  PM2 process not online - Status: ${githubAgent.pm2_env.status}`, 
          'WARN'
        );
      }
      
      return { running: isOnline, process: githubAgent };
      
    } catch (error) {
      await this.log(`❌ PM2 status check failed: ${error.message}`, 'ERROR');
      return { running: false, error: error.message };
    }
  }

  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const reportFile = path.join(this.logDir, `daily-report-${today}.json`);
    
    try {
      const logContent = await fs.readFile(this.healthLog, 'utf8');
      const lines = logContent.split('\n').filter(line => line.includes(today));
      
      const stats = {
        date: today,
        total_checks: lines.length,
        successful_checks: lines.filter(line => line.includes('✅')).length,
        warnings: lines.filter(line => line.includes('⚠️')).length,
        errors: lines.filter(line => line.includes('❌')).length,
        uptime_percentage: 0
      };
      
      if (stats.total_checks > 0) {
        stats.uptime_percentage = Math.round(
          (stats.successful_checks / stats.total_checks) * 100
        );
      }
      
      await fs.writeFile(reportFile, JSON.stringify(stats, null, 2));
      await this.log(`📊 Daily report generated: ${stats.uptime_percentage}% uptime`, 'INFO');
      
      return stats;
      
    } catch (error) {
      await this.log(`❌ Failed to generate daily report: ${error.message}`, 'ERROR');
      return null;
    }
  }

  async start(intervalMinutes = 1) {
    await this.log('🚀 Starting 24/7 health monitor...', 'INFO');
    await this.log(`⏱️  Check interval: ${intervalMinutes} minute(s)`, 'INFO');
    
    const interval = intervalMinutes * 60 * 1000;
    let checkCount = 0;
    
    // Initial check
    await this.performFullCheck();
    
    // Set up recurring checks
    const monitorInterval = setInterval(async () => {
      checkCount++;
      await this.performFullCheck();
      
      // Generate daily report every 24 hours (1440 minutes)
      if (checkCount % (1440 / intervalMinutes) === 0) {
        await this.generateDailyReport();
      }
    }, interval);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      this.log('🛑 Health monitor stopped gracefully', 'INFO');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      clearInterval(monitorInterval);
      this.log('🛑 Health monitor terminated', 'INFO');
      process.exit(0);
    });
  }

  async performFullCheck() {
    const [healthResult, pm2Result] = await Promise.all([
      this.checkHealth(),
      this.checkPM2Status()
    ]);
    
    if (!healthResult.healthy || !pm2Result.running) {
      await this.log('🚨 System health issues detected!', 'ERROR');
      
      // Could add automatic restart logic here
      // await this.attemptRestart();
    }
    
    return { health: healthResult, pm2: pm2Result };
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new HealthMonitor();
  
  const args = process.argv.slice(2);
  const intervalArg = args.find(arg => arg.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 1;
  
  if (args.includes('--once')) {
    // Single health check
    monitor.performFullCheck().then(() => process.exit(0));
  } else if (args.includes('--report')) {
    // Generate daily report
    monitor.generateDailyReport().then(() => process.exit(0));
  } else {
    // Start continuous monitoring
    monitor.start(interval);
  }
}

module.exports = HealthMonitor;