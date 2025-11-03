import { useCallback, useRef } from 'react';

export interface StreamingMetric {
  timestamp: number;
  type: 'generation' | 'persona' | 'export';
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export function useStreamingMetrics() {
  const metricsRef = useRef<StreamingMetric[]>([]);

  /**
   * Records a streaming metric.
   * 
   * All additional properties (e.g., model, latency, tokensGenerated, etc.) should be included in the `metadata` field.
   * Example:
   *   recordMetric({
   *     type: 'generation',
   *     duration: 1234,
   *     success: true,
   *     metadata: {
   *       model: 'gpt-4',
   *       latency: 1200,
   *       tokensGenerated: 512,
   *       wasAborted: false,
   *       status: 'success'
   *     }
   *   });
   */
  const recordMetric = useCallback((metric: Omit<StreamingMetric, 'timestamp'>) => {
    const fullMetric: StreamingMetric = {
      ...metric,
      timestamp: Date.now(),
    };
    
    metricsRef.current.push(fullMetric);
    
    // Optional: log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Streaming metric recorded:', fullMetric);
    }
    
    // Keep only last 100 metrics to prevent memory leaks
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }
  }, []);

  const getMetrics = useCallback(() => {
    return [...metricsRef.current];
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    recordMetric,
    getMetrics,
    clearMetrics,
  };
}
