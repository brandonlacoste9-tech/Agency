/**
 * Circuit Breaker - Implements circuit breaker pattern for AI service calls
 * Prevents cascading failures and provides automatic recovery
 */

class CircuitBreaker {
    constructor(options = {}) {
        this.options = {
            failureThreshold: options.failureThreshold || 5,     // Number of failures before opening
            resetTimeout: options.resetTimeout || 60000,        // Time before attempting reset (1 minute)
            monitoringPeriod: options.monitoringPeriod || 120000, // Period to monitor failures (2 minutes)
            expectedErrors: options.expectedErrors || [],        // Errors that don't count as failures
            ...options
        };

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.successCount = 0;
        this.failures = []; // Track failures with timestamps

        console.log(`🔌 Circuit Breaker initialized - threshold: ${this.options.failureThreshold}, reset timeout: ${this.options.resetTimeout}ms`);
    }

    async execute(operation, ...args) {
        // Check if we should attempt operation
        if (!this.canExecute()) {
            const error = new Error('Circuit breaker is OPEN - operation rejected');
            error.code = 'CIRCUIT_BREAKER_OPEN';
            error.state = this.state;
            error.nextAttemptTime = this.nextAttemptTime;
            throw error;
        }

        try {
            const result = await operation(...args);
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    canExecute() {
        const now = Date.now();

        switch (this.state) {
            case 'CLOSED':
                return true;

            case 'OPEN':
                // Check if we should transition to HALF_OPEN
                if (now >= this.nextAttemptTime) {
                    this.state = 'HALF_OPEN';
                    this.successCount = 0;
                    console.log('🔄 Circuit breaker transitioning to HALF_OPEN - attempting recovery');
                    return true;
                }
                return false;

            case 'HALF_OPEN':
                return true;

            default:
                return false;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.failures = [];

        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            // If we have a few successes, close the circuit
            if (this.successCount >= 3) {
                this.state = 'CLOSED';
                console.log('✅ Circuit breaker CLOSED - service recovered');
            }
        }
    }

    onFailure(error) {
        // Don't count expected errors as failures
        if (this.isExpectedError(error)) {
            console.log(`⚠️ Expected error ignored by circuit breaker: ${error.message}`);
            return;
        }

        const now = Date.now();
        this.lastFailureTime = now;
        
        // Add failure to tracking array
        this.failures.push({
            timestamp: now,
            error: error.message,
            code: error.code
        });

        // Remove old failures outside monitoring period
        this.failures = this.failures.filter(
            f => (now - f.timestamp) < this.options.monitoringPeriod
        );

        // Count recent failures
        this.failureCount = this.failures.length;

        switch (this.state) {
            case 'CLOSED':
                if (this.failureCount >= this.options.failureThreshold) {
                    this.state = 'OPEN';
                    this.nextAttemptTime = now + this.options.resetTimeout;
                    console.error(`🚨 Circuit breaker OPEN - ${this.failureCount} failures detected. Next attempt: ${new Date(this.nextAttemptTime).toISOString()}`);
                }
                break;

            case 'HALF_OPEN':
                // Any failure in HALF_OPEN goes back to OPEN
                this.state = 'OPEN';
                this.nextAttemptTime = now + this.options.resetTimeout;
                this.successCount = 0;
                console.error(`🚨 Circuit breaker returning to OPEN - recovery attempt failed`);
                break;
        }
    }

    isExpectedError(error) {
        return this.options.expectedErrors.some(expectedError => {
            if (typeof expectedError === 'string') {
                return error.message.includes(expectedError) || error.code === expectedError;
            }
            if (expectedError instanceof RegExp) {
                return expectedError.test(error.message);
            }
            return false;
        });
    }

    getStatus() {
        const now = Date.now();
        
        return {
            state: this.state,
            failureCount: this.failureCount,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            successCount: this.successCount,
            canExecute: this.canExecute(),
            timeSinceLastFailure: this.lastFailureTime ? now - this.lastFailureTime : null,
            timeUntilNextAttempt: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - now) : null,
            recentFailureRate: this.calculateRecentFailureRate(),
            options: this.options
        };
    }

    calculateRecentFailureRate() {
        const now = Date.now();
        const recentPeriod = 60000; // Last minute
        const recentFailures = this.failures.filter(f => (now - f.timestamp) < recentPeriod);
        
        // Estimate total attempts (this is simplified - in real implementation you'd track all attempts)
        const estimatedAttempts = Math.max(recentFailures.length, 1);
        
        return recentFailures.length / estimatedAttempts;
    }

    // Manual controls for testing and emergency situations
    forceOpen(reason = 'Manual override') {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.options.resetTimeout;
        console.warn(`🔴 Circuit breaker MANUALLY OPENED: ${reason}`);
    }

    forceClose(reason = 'Manual override') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.failures = [];
        this.nextAttemptTime = null;
        this.successCount = 0;
        console.log(`🟢 Circuit breaker MANUALLY CLOSED: ${reason}`);
    }

    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.failures = [];
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.successCount = 0;
        console.log('🔄 Circuit breaker RESET');
    }
}

export default CircuitBreaker;
