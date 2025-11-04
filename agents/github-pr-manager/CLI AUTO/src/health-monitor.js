/**
 * Health Monitor - Advanced system health tracking and alerting
 * Provides real-time health metrics, circuit breaker status, and system diagnostics
 */

import { EventEmitter } from 'events';

class HealthMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            checkInterval: options.checkInterval || 30000, // 30 seconds
            alertThresholds: {
                memoryUsage: options.memoryThreshold || 0.85, // 85%
                responseTime: options.responseTimeThreshold || 5000, // 5 seconds
                errorRate: options.errorRateThreshold || 0.1, // 10%
                ...options.alertThresholds
            },
            retentionPeriod: options.retentionPeriod || 300000, // 5 minutes
            ...options
        };

        this.metrics = {
            system: {
                startTime: Date.now(),
                uptime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                diskUsage: 0
            },
            application: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                activeConnections: 0,
                queueLength: 0
            },
            ai: {
                totalAnalyses: 0,
                successfulAnalyses: 0,
                failedAnalyses: 0,
                averageProcessingTime: 0,
                circuitBreakerStatus: 'CLOSED'
            },
            alerts: []
        };

        this.history = [];
        this.activeAlerts = new Map();
        this.isMonitoring = false;

        this.startMonitoring();
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkAlerts();
            this.pruneHistory();
        }, this.options.checkInterval);

        console.log('🔍 Health Monitor started - collecting metrics every', this.options.checkInterval / 1000, 'seconds');
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('⏹️ Health Monitor stopped');
    }

    collectMetrics() {
        try {
            // System metrics
            const memUsage = process.memoryUsage();
            this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;
            this.metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;

            // Calculate CPU usage (simplified)
            const usage = process.cpuUsage();
            this.metrics.system.cpuUsage = (usage.user + usage.system) / 1000000; // Convert to seconds

            // Store snapshot
            const snapshot = {
                timestamp: Date.now(),
                ...JSON.parse(JSON.stringify(this.metrics))
            };
            
            this.history.push(snapshot);
            this.emit('metrics', snapshot);

        } catch (error) {
            console.error('❌ Error collecting metrics:', error);
            this.recordError('METRICS_COLLECTION_ERROR', error.message);
        }
    }

    checkAlerts() {
        const alerts = [];

        // Memory usage alert
        if (this.metrics.system.memoryUsage > this.options.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'HIGH_MEMORY_USAGE',
                severity: 'WARNING',
                message: `Memory usage at ${(this.metrics.system.memoryUsage * 100).toFixed(1)}%`,
                value: this.metrics.system.memoryUsage,
                threshold: this.options.alertThresholds.memoryUsage
            });
        }

        // Error rate alert
        const totalRequests = this.metrics.application.totalRequests;
        const failedRequests = this.metrics.application.failedRequests;
        const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

        if (errorRate > this.options.alertThresholds.errorRate && totalRequests > 10) {
            alerts.push({
                type: 'HIGH_ERROR_RATE',
                severity: 'CRITICAL',
                message: `Error rate at ${(errorRate * 100).toFixed(1)}%`,
                value: errorRate,
                threshold: this.options.alertThresholds.errorRate
            });
        }

        // AI circuit breaker alert
        if (this.metrics.ai.circuitBreakerStatus === 'OPEN') {
            alerts.push({
                type: 'AI_CIRCUIT_BREAKER_OPEN',
                severity: 'CRITICAL',
                message: 'AI service circuit breaker is OPEN - requests failing',
                value: this.metrics.ai.circuitBreakerStatus,
                threshold: 'CLOSED'
            });
        }

        // Queue backlog alert
        if (this.metrics.application.queueLength > 100) {
            alerts.push({
                type: 'QUEUE_BACKLOG',
                severity: 'WARNING',
                message: `Queue backlog: ${this.metrics.application.queueLength} items`,
                value: this.metrics.application.queueLength,
                threshold: 100
            });
        }

        // Process new alerts
        alerts.forEach(alert => {
            const alertKey = `${alert.type}_${alert.severity}`;
            
            if (!this.activeAlerts.has(alertKey)) {
                this.activeAlerts.set(alertKey, alert);
                this.metrics.alerts.unshift({
                    ...alert,
                    timestamp: Date.now(),
                    id: this.generateAlertId()
                });
                
                this.emit('alert', alert);
                console.warn(`⚠️ ALERT [${alert.severity}]: ${alert.message}`);
            }
        });

        // Clear resolved alerts
        for (const [key, alert] of this.activeAlerts.entries()) {
            const stillActive = alerts.some(a => `${a.type}_${a.severity}` === key);
            if (!stillActive) {
                this.activeAlerts.delete(key);
                console.log(`✅ Alert resolved: ${alert.type}`);
            }
        }
    }

    recordRequest(success = true, responseTime = 0) {
        this.metrics.application.totalRequests++;
        
        if (success) {
            this.metrics.application.successfulRequests++;
        } else {
            this.metrics.application.failedRequests++;
        }

        // Update average response time (simple moving average)
        const total = this.metrics.application.totalRequests;
        const current = this.metrics.application.averageResponseTime;
        this.metrics.application.averageResponseTime = ((current * (total - 1)) + responseTime) / total;
    }

    recordAIAnalysis(success = true, processingTime = 0) {
        this.metrics.ai.totalAnalyses++;
        
        if (success) {
            this.metrics.ai.successfulAnalyses++;
        } else {
            this.metrics.ai.failedAnalyses++;
        }

        // Update average processing time
        const total = this.metrics.ai.totalAnalyses;
        const current = this.metrics.ai.averageProcessingTime;
        this.metrics.ai.averageProcessingTime = ((current * (total - 1)) + processingTime) / total;
    }

    updateCircuitBreakerStatus(status) {
        if (['CLOSED', 'OPEN', 'HALF_OPEN'].includes(status)) {
            this.metrics.ai.circuitBreakerStatus = status;
            console.log(`🔌 Circuit breaker status: ${status}`);
        }
    }

    updateQueueLength(length) {
        this.metrics.application.queueLength = length;
    }

    updateActiveConnections(count) {
        this.metrics.application.activeConnections = count;
    }

    recordError(type, message, metadata = {}) {
        const error = {
            id: this.generateAlertId(),
            type,
            message,
            timestamp: Date.now(),
            metadata
        };

        console.error(`❌ Error recorded [${type}]: ${message}`, metadata);
        this.emit('error', error);
    }

    getHealthStatus() {
        const now = Date.now();
        const uptime = now - this.metrics.system.startTime;
        
        // Calculate recent error rate (last 5 minutes)
        const recentHistory = this.history.filter(h => (now - h.timestamp) < 300000);
        const recentRequests = recentHistory.reduce((sum, h) => sum + (h.application.totalRequests || 0), 0);
        const recentErrors = recentHistory.reduce((sum, h) => sum + (h.application.failedRequests || 0), 0);
        const recentErrorRate = recentRequests > 0 ? recentErrors / recentRequests : 0;

        return {
            status: this.determineOverallStatus(),
            timestamp: now,
            uptime,
            uptimeHuman: this.formatUptime(uptime),
            metrics: this.metrics,
            recentErrorRate,
            activeAlerts: Array.from(this.activeAlerts.values()),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }

    determineOverallStatus() {
        // Critical alerts make system unhealthy
        const criticalAlerts = Array.from(this.activeAlerts.values())
            .filter(alert => alert.severity === 'CRITICAL');
        
        if (criticalAlerts.length > 0) {
            return 'UNHEALTHY';
        }

        // Warning alerts make system degraded
        const warningAlerts = Array.from(this.activeAlerts.values())
            .filter(alert => alert.severity === 'WARNING');
        
        if (warningAlerts.length > 0) {
            return 'DEGRADED';
        }

        return 'HEALTHY';
    }

    getMetricsHistory(minutes = 5) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.history.filter(h => h.timestamp > cutoff);
    }

    pruneHistory() {
        const cutoff = Date.now() - this.options.retentionPeriod;
        this.history = this.history.filter(h => h.timestamp > cutoff);
        
        // Also prune old alerts
        this.metrics.alerts = this.metrics.alerts
            .filter(alert => (Date.now() - alert.timestamp) < this.options.retentionPeriod)
            .slice(0, 100); // Keep max 100 alerts
    }

    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    generateAlertId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Graceful shutdown
    shutdown() {
        console.log('🔄 Health Monitor shutting down...');
        this.stopMonitoring();
        this.emit('shutdown');
    }
}

export default HealthMonitor;
