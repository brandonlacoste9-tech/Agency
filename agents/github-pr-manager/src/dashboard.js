/**
 * Dashboard API - Comprehensive monitoring and control dashboard
 * Provides real-time insights and administrative controls
 */

function createDashboardAPI(app, healthMonitor, aiCircuitBreaker, githubCircuitBreaker) {
  
  // Main dashboard endpoint
  app.get('/dashboard', (req, res) => {
    const healthStatus = healthMonitor.getHealthStatus();
    const aiStatus = aiCircuitBreaker.getStatus();
    const githubStatus = githubCircuitBreaker.getStatus();
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      service: {
        name: 'GitHub PR Manager',
        version: process.env.npm_package_version || '1.0.0',
        uptime: healthStatus.uptimeHuman,
        status: healthStatus.status,
        environment: process.env.NODE_ENV || 'development'
      },
      configuration: {
        repository: process.env.GITHUB_REPOSITORY || 'not configured',
        aiEnabled: (process.env.ENABLE_AI_ANALYSIS || 'true').toLowerCase() === 'true',
        aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        promoteDrafts: (process.env.PROMOTE_DRAFTS || 'false').toLowerCase() === 'true',
        port: process.env.PORT || 3001
      },
      health: {
        overall: healthStatus.status,
        metrics: healthStatus.metrics,
        alerts: healthStatus.activeAlerts,
        recentErrorRate: healthStatus.recentErrorRate
      },
      circuitBreakers: {
        ai: {
          state: aiStatus.state,
          canExecute: aiStatus.canExecute,
          failureCount: aiStatus.failureCount,
          successCount: aiStatus.successCount,
          recentFailures: aiStatus.failures.slice(-5), // Last 5 failures
          timeSinceLastFailure: aiStatus.timeSinceLastFailure,
          timeUntilNextAttempt: aiStatus.timeUntilNextAttempt,
          options: aiStatus.options
        },
        github: {
          state: githubStatus.state,
          canExecute: githubStatus.canExecute,
          failureCount: githubStatus.failureCount,
          successCount: githubStatus.successCount,
          recentFailures: githubStatus.failures.slice(-5),
          timeSinceLastFailure: githubStatus.timeSinceLastFailure,
          timeUntilNextAttempt: githubStatus.timeUntilNextAttempt,
          options: githubStatus.options
        }
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Add HTML response if requested
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      res.send(generateDashboardHTML(dashboard));
    } else {
      res.json(dashboard);
    }
  });

  // Metrics history endpoint
  app.get('/dashboard/metrics/history', (req, res) => {
    const minutes = parseInt(req.query.minutes) || 5;
    const history = healthMonitor.getMetricsHistory(minutes);
    
    res.json({
      timeRange: `${minutes} minutes`,
      dataPoints: history.length,
      metrics: history
    });
  });

  // Circuit breaker control endpoints
  app.post('/dashboard/circuit-breakers/:service/reset', (req, res) => {
    const service = req.params.service;
    const reason = req.body.reason || 'Manual reset via dashboard';
    
    try {
      if (service === 'ai') {
        aiCircuitBreaker.reset();
        healthMonitor.updateCircuitBreakerStatus(aiCircuitBreaker.state);
        res.json({ 
          success: true, 
          message: 'AI circuit breaker reset',
          newState: aiCircuitBreaker.getStatus()
        });
      } else if (service === 'github') {
        githubCircuitBreaker.reset();
        res.json({ 
          success: true, 
          message: 'GitHub circuit breaker reset',
          newState: githubCircuitBreaker.getStatus()
        });
      } else {
        res.status(400).json({ error: 'Unknown service. Use "ai" or "github"' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/dashboard/circuit-breakers/:service/force-open', (req, res) => {
    const service = req.params.service;
    const reason = req.body.reason || 'Manual override via dashboard';
    
    try {
      if (service === 'ai') {
        aiCircuitBreaker.forceOpen(reason);
        healthMonitor.updateCircuitBreakerStatus(aiCircuitBreaker.state);
        res.json({ 
          success: true, 
          message: 'AI circuit breaker forced open',
          newState: aiCircuitBreaker.getStatus()
        });
      } else if (service === 'github') {
        githubCircuitBreaker.forceOpen(reason);
        res.json({ 
          success: true, 
          message: 'GitHub circuit breaker forced open',
          newState: githubCircuitBreaker.getStatus()
        });
      } else {
        res.status(400).json({ error: 'Unknown service. Use "ai" or "github"' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/dashboard/circuit-breakers/:service/force-close', (req, res) => {
    const service = req.params.service;
    const reason = req.body.reason || 'Manual override via dashboard';
    
    try {
      if (service === 'ai') {
        aiCircuitBreaker.forceClose(reason);
        healthMonitor.updateCircuitBreakerStatus(aiCircuitBreaker.state);
        res.json({ 
          success: true, 
          message: 'AI circuit breaker forced closed',
          newState: aiCircuitBreaker.getStatus()
        });
      } else if (service === 'github') {
        githubCircuitBreaker.forceClose(reason);
        res.json({ 
          success: true, 
          message: 'GitHub circuit breaker forced closed',
          newState: githubCircuitBreaker.getStatus()
        });
      } else {
        res.status(400).json({ error: 'Unknown service. Use "ai" or "github"' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System information endpoint
  app.get('/dashboard/system', (req, res) => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        argv: process.argv
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        totalMicroseconds: cpuUsage.user + cpuUsage.system
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        githubRepo: process.env.GITHUB_REPOSITORY,
        port: process.env.PORT,
        aiEnabled: process.env.ENABLE_AI_ANALYSIS,
        aiServiceUrl: process.env.AI_SERVICE_URL
      }
    });
  });
}

function generateDashboardHTML(dashboard) {
  const statusColor = dashboard.health.overall === 'HEALTHY' ? '#10b981' : 
                     dashboard.health.overall === 'DEGRADED' ? '#f59e0b' : '#ef4444';
  
  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub PR Manager Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: white; 
            padding: 24px; 
            border-radius: 12px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
        }
        .status-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600;
            color: white; 
            background: ${statusColor};
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .card { 
            background: white; 
            padding: 24px; 
            border-radius: 12px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card h3 { 
            margin-bottom: 16px; 
            color: #374151; 
            font-size: 18px; 
            font-weight: 600;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f3f4f6;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #6b7280; }
        .metric-value { font-weight: 600; }
        .circuit-breaker { 
            padding: 12px; 
            border-radius: 8px; 
            margin-bottom: 12px;
        }
        .circuit-closed { background: #dcfce7; border: 1px solid #16a34a; }
        .circuit-open { background: #fee2e2; border: 1px solid #dc2626; }
        .circuit-half-open { background: #fef3c7; border: 1px solid #d97706; }
        .alert { 
            padding: 12px; 
            border-radius: 8px; 
            margin-bottom: 8px;
            background: #fee2e2; 
            border: 1px solid #fca5a5;
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover { background: #2563eb; }
        pre { 
            background: #f1f5f9; 
            padding: 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 GitHub PR Manager Dashboard</h1>
            <div style="margin-top: 12px;">
                <span class="status-badge">${dashboard.health.overall}</span>
                <span style="margin-left: 16px; color: #6b7280;">
                    Uptime: ${dashboard.service.uptime} | 
                    Version: ${dashboard.service.version} | 
                    Updated: ${new Date(dashboard.timestamp).toLocaleString()}
                </span>
                <button class="refresh-btn" onclick="location.reload()" style="float: right;">
                    🔄 Refresh
                </button>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 System Health</h3>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="metric-value" style="color: ${statusColor};">${dashboard.health.overall}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Connections</span>
                    <span class="metric-value">${dashboard.health.metrics.application.activeConnections}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Requests</span>
                    <span class="metric-value">${dashboard.health.metrics.application.totalRequests}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value">${(dashboard.health.recentErrorRate * 100).toFixed(2)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">${(dashboard.performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
                </div>
            </div>

            <div class="card">
                <h3>⚙️ Configuration</h3>
                <div class="metric">
                    <span class="metric-label">Repository</span>
                    <span class="metric-value">${dashboard.configuration.repository}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">AI Analysis</span>
                    <span class="metric-value">${dashboard.configuration.aiEnabled ? '✅ Enabled' : '❌ Disabled'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">AI Service</span>
                    <span class="metric-value">${dashboard.configuration.aiServiceUrl}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Auto-promote Drafts</span>
                    <span class="metric-value">${dashboard.configuration.promoteDrafts ? 'Yes' : 'No'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment</span>
                    <span class="metric-value">${dashboard.service.environment}</span>
                </div>
            </div>

            <div class="card">
                <h3>🔌 Circuit Breakers</h3>
                <div class="circuit-breaker circuit-${dashboard.circuitBreakers.ai.state.toLowerCase().replace('_', '-')}">
                    <strong>AI Service</strong><br>
                    State: ${dashboard.circuitBreakers.ai.state}<br>
                    Failures: ${dashboard.circuitBreakers.ai.failureCount}<br>
                    Can Execute: ${dashboard.circuitBreakers.ai.canExecute ? 'Yes' : 'No'}<br>
                    ${dashboard.circuitBreakers.ai.timeUntilNextAttempt ? 
                      `Next Attempt: ${formatTime(dashboard.circuitBreakers.ai.timeUntilNextAttempt)}` : ''}
                </div>
                <div class="circuit-breaker circuit-${dashboard.circuitBreakers.github.state.toLowerCase().replace('_', '-')}">
                    <strong>GitHub API</strong><br>
                    State: ${dashboard.circuitBreakers.github.state}<br>
                    Failures: ${dashboard.circuitBreakers.github.failureCount}<br>
                    Can Execute: ${dashboard.circuitBreakers.github.canExecute ? 'Yes' : 'No'}<br>
                    ${dashboard.circuitBreakers.github.timeUntilNextAttempt ? 
                      `Next Attempt: ${formatTime(dashboard.circuitBreakers.github.timeUntilNextAttempt)}` : ''}
                </div>
            </div>

            ${dashboard.health.alerts.length > 0 ? `
            <div class="card">
                <h3>⚠️ Active Alerts</h3>
                ${dashboard.health.alerts.map(alert => `
                    <div class="alert">
                        <strong>${alert.type}</strong> [${alert.severity}]<br>
                        ${alert.message}<br>
                        <small>Since: ${new Date(alert.timestamp).toLocaleString()}</small>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>

        <div style="margin-top: 24px;" class="card">
            <h3>📋 Raw Data</h3>
            <pre>${JSON.stringify(dashboard, null, 2)}</pre>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
  `;
}

export { createDashboardAPI };
