import { NextResponse } from 'next/server';

interface SystemMetrics {
  timestamp: number;
  services: {
    'github-pr-manager': ServiceStatus;
    postgres: ServiceStatus;
    redis: ServiceStatus;
  };
  performance: {
    processingRate: number;
    successRate: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  recentActivity: ActivityEvent[];
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  uptime: number;
  lastChecked: string;
  responseTime?: number;
}

interface ActivityEvent {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

// Simulate Docker service health checks
async function checkDockerServices(): Promise<Record<string, ServiceStatus>> {
  const services = ['github-pr-manager', 'postgres', 'redis'];
  const serviceStatus: Record<string, ServiceStatus> = {};

  for (const service of services) {
    try {
      // In a real implementation, you would check actual Docker service health
      // For now, we'll simulate with random values
      const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
      const responseTime = Math.floor(Math.random() * 100) + 10;
      
      serviceStatus[service] = {
        status: isHealthy ? 'healthy' : (Math.random() > 0.5 ? 'warning' : 'unhealthy'),
        uptime: parseFloat((Math.random() * 10 + 90).toFixed(1)), // 90-100% uptime
        lastChecked: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      serviceStatus[service] = {
        status: 'unhealthy',
        uptime: 0,
        lastChecked: new Date().toISOString()
      };
    }
  }

  return serviceStatus;
}

// Generate realistic performance metrics
function generatePerformanceMetrics() {
  const baseProcessingRate = 75;
  const baseSuccessRate = 95;
  const baseErrorRate = 3;
  
  return {
    processingRate: Math.floor(baseProcessingRate + (Math.random() - 0.5) * 20),
    successRate: Math.floor(baseSuccessRate + (Math.random() - 0.5) * 10),
    errorRate: Math.floor(baseErrorRate + (Math.random() - 0.5) * 4),
    memoryUsage: Math.floor(Math.random() * 40 + 30), // 30-70%
    cpuUsage: Math.floor(Math.random() * 50 + 20), // 20-70%
  };
}

// Generate recent activity events
function generateRecentActivity(): ActivityEvent[] {
  const activities = [
    { type: 'success' as const, message: 'GitHub PR Manager processed 12 pull requests' },
    { type: 'info' as const, message: 'Cache hit rate improved to 89.3%' },
    { type: 'warning' as const, message: 'Detected 4 merge conflicts in ready-to-merge PRs' },
    { type: 'success' as const, message: 'All Docker services health check passed' },
    { type: 'info' as const, message: 'Database connection pool optimized' },
    { type: 'success' as const, message: 'Redis cache cleared expired keys' },
    { type: 'warning' as const, message: 'High memory usage detected on PR manager' },
    { type: 'success' as const, message: 'Webhook endpoint responded successfully' }
  ];

  // Return 4-6 recent activities with timestamps
  const count = Math.floor(Math.random() * 3) + 4;
  const selectedActivities = activities
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((activity, index) => ({
      ...activity,
      timestamp: Date.now() - (index * 2 * 60 * 1000) // 2 minutes apart
    }));

  return selectedActivities;
}

export async function GET() {
  try {
    const serviceStatus = await checkDockerServices();
    const performance = generatePerformanceMetrics();
    const recentActivity = generateRecentActivity();

    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      services: {
        'github-pr-manager': serviceStatus['github-pr-manager'],
        postgres: serviceStatus['postgres'],
        redis: serviceStatus['redis']
      },
      performance,
      recentActivity
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}

// Real Docker health check implementation (commented out for now)
/*
async function checkDockerServiceHealth(serviceName: string): Promise<ServiceStatus> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Check if service is running
    const { stdout } = await execAsync(`docker-compose -f agents/docker-compose-basic.yml ps ${serviceName}`);
    
    if (stdout.includes('Up') && stdout.includes('healthy')) {
      return {
        status: 'healthy',
        uptime: 99.9,
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 50) + 10
      };
    } else if (stdout.includes('Up')) {
      return {
        status: 'warning',
        uptime: 95.0,
        lastChecked: new Date().toISOString()
      };
    } else {
      return {
        status: 'unhealthy',
        uptime: 0,
        lastChecked: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      uptime: 0,
      lastChecked: new Date().toISOString()
    };
  }
}
*/
