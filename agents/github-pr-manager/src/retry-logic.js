/**
 * Retry Logic - Advanced retry mechanisms with exponential backoff and jitter
 * Provides resilient error recovery for external service calls
 */

class RetryableError extends Error {
    constructor(message, retryable = true, retryAfter = null) {
        super(message);
        this.name = 'RetryableError';
        this.retryable = retryable;
        this.retryAfter = retryAfter;
    }
}

class RetryLogic {
    constructor(options = {}) {
        this.options = {
            maxAttempts: options.maxAttempts || 3,
            baseDelay: options.baseDelay || 1000,      // 1 second
            maxDelay: options.maxDelay || 30000,       // 30 seconds
            backoffFactor: options.backoffFactor || 2,
            jitterEnabled: options.jitterEnabled !== false,
            jitterFactor: options.jitterFactor || 0.1,
            retryableErrors: options.retryableErrors || [
                'ECONNRESET',
                'ECONNREFUSED', 
                'ETIMEDOUT',
                'ENOTFOUND',
                'RATE_LIMIT',
                'TEMPORARY_FAILURE'
            ],
            retryableStatusCodes: options.retryableStatusCodes || [
                408, // Request Timeout
                429, // Too Many Requests
                500, // Internal Server Error
                502, // Bad Gateway
                503, // Service Unavailable
                504  // Gateway Timeout
            ],
            ...options
        };

        console.log(`🔄 Retry Logic initialized - max attempts: ${this.options.maxAttempts}, base delay: ${this.options.baseDelay}ms`);
    }

    async execute(operation, context = {}) {
        let lastError;
        let attempt = 0;
        const operationId = this.generateOperationId();
        const startTime = Date.now();

        console.log(`🎯 Starting retry operation [${operationId}] - max attempts: ${this.options.maxAttempts}`);

        while (attempt < this.options.maxAttempts) {
            attempt++;
            const attemptStartTime = Date.now();

            try {
                console.log(`🔄 Attempt ${attempt}/${this.options.maxAttempts} [${operationId}]`);
                
                const result = await operation(attempt, context);
                
                const duration = Date.now() - attemptStartTime;
                const totalDuration = Date.now() - startTime;
                
                console.log(`✅ Operation succeeded [${operationId}] - attempt: ${attempt}, duration: ${duration}ms, total: ${totalDuration}ms`);
                
                return {
                    result,
                    attempts: attempt,
                    duration: totalDuration,
                    operationId
                };

            } catch (error) {
                lastError = error;
                const duration = Date.now() - attemptStartTime;
                
                console.warn(`❌ Attempt ${attempt} failed [${operationId}] - ${error.message} (${duration}ms)`);

                // Check if error is retryable
                if (!this.shouldRetry(error, attempt)) {
                    console.error(`🛑 Non-retryable error or max attempts reached [${operationId}] - giving up`);
                    break;
                }

                // Calculate delay for next attempt
                if (attempt < this.options.maxAttempts) {
                    const delay = this.calculateDelay(attempt, error);
                    console.log(`⏳ Waiting ${delay}ms before attempt ${attempt + 1} [${operationId}]`);
                    
                    await this.delay(delay);
                }
            }
        }

        // All attempts failed
        const totalDuration = Date.now() - startTime;
        const finalError = new Error(`Operation failed after ${attempt} attempts: ${lastError.message}`);
        finalError.originalError = lastError;
        finalError.attempts = attempt;
        finalError.duration = totalDuration;
        finalError.operationId = operationId;

        console.error(`💥 Operation failed [${operationId}] - ${attempt} attempts, ${totalDuration}ms total`);
        throw finalError;
    }

    shouldRetry(error, attempt) {
        // Don't retry if we've reached max attempts
        if (attempt >= this.options.maxAttempts) {
            return false;
        }

        // Check if explicitly marked as non-retryable
        if (error.retryable === false) {
            return false;
        }

        // Check error codes
        if (error.code && this.options.retryableErrors.includes(error.code)) {
            return true;
        }

        // Check HTTP status codes
        if (error.status && this.options.retryableStatusCodes.includes(error.status)) {
            return true;
        }

        // Check for specific error patterns
        const retryablePatterns = [
            /timeout/i,
            /connection.*reset/i,
            /connection.*refused/i,
            /network.*error/i,
            /rate.*limit/i,
            /temporary/i,
            /service.*unavailable/i
        ];

        const isRetryablePattern = retryablePatterns.some(pattern => 
            pattern.test(error.message)
        );

        if (isRetryablePattern) {
            return true;
        }

        // Default to non-retryable
        return false;
    }

    calculateDelay(attempt, error = null) {
        // Check if error specifies a retry-after delay
        if (error && error.retryAfter) {
            return Math.min(error.retryAfter * 1000, this.options.maxDelay);
        }

        // Exponential backoff: baseDelay * (backoffFactor ^ (attempt - 1))
        let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);
        
        // Cap the delay
        delay = Math.min(delay, this.options.maxDelay);

        // Add jitter to prevent thundering herd
        if (this.options.jitterEnabled) {
            const jitter = delay * this.options.jitterFactor * (Math.random() * 2 - 1);
            delay = Math.max(0, delay + jitter);
        }

        return Math.round(delay);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateOperationId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Convenience method for wrapping operations
    static wrap(operation, options = {}) {
        const retryLogic = new RetryLogic(options);
        return (...args) => retryLogic.execute(() => operation(...args));
    }

    // Convenience method for HTTP requests
    static async retryHttpRequest(requestFn, options = {}) {
        const retryLogic = new RetryLogic({
            maxAttempts: 3,
            baseDelay: 1000,
            retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            ...options
        });

        return retryLogic.execute(async (attempt) => {
            try {
                const response = await requestFn();
                
                // Check if response indicates an error
                if (response.status && options.retryableStatusCodes?.includes(response.status)) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = response.status;
                    error.response = response;
                    throw error;
                }

                return response;
            } catch (error) {
                // Enhance error with retry information
                if (error.response) {
                    error.status = error.response.status;
                    
                    // Check for Retry-After header
                    const retryAfter = error.response.headers?.['retry-after'];
                    if (retryAfter) {
                        error.retryAfter = parseInt(retryAfter);
                    }
                }

                throw error;
            }
        });
    }

    // Create a retryable version of any async function
    static createRetryable(fn, options = {}) {
        const retryLogic = new RetryLogic(options);
        
        return async function retryableFunction(...args) {
            return retryLogic.execute(async () => {
                return fn.apply(this, args);
            });
        };
    }
}

// Export both the class and convenience functions
module.exports = {
    RetryLogic,
    RetryableError,
    
    // Convenience functions
    retry: (operation, options) => new RetryLogic(options).execute(operation),
    retryHttp: RetryLogic.retryHttpRequest,
    wrap: RetryLogic.wrap,
    createRetryable: RetryLogic.createRetryable
};
