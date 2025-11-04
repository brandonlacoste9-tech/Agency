/**
 * Hook for tracking streaming metrics
 * Records performance metrics for AI streaming operations
 */

import { useCallback } from "react";

export interface StreamingMetric {
  timestamp?: number;
  type?: "start" | "chunk" | "complete" | "error";
  model?: string;
  tokensGenerated?: number;
  latency?: number;
  totalDuration?: number;
  wasAborted?: boolean;
  status?: "success" | "error" | "aborted";
  error?: string;
}

export function useStreamingMetrics() {
  /**
   * Record a streaming metric
   */
  const recordMetric = useCallback(async (metric: StreamingMetric) => {
    try {
      // Add timestamp if not provided
      const enrichedMetric = {
        ...metric,
        timestamp: metric.timestamp || Date.now(),
      };

      // In production, this would send metrics to an analytics endpoint
      // For now, we'll just log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log("[StreamingMetric]", enrichedMetric);
      }

      // Send to analytics API if configured
      const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;
      if (analyticsUrl) {
        await fetch(`${analyticsUrl}/metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enrichedMetric),
        });
      }
    } catch (error) {
      // Silently fail - we don't want metrics to break the app
      console.error("Failed to record metric:", error);
    }
  }, []);

  /**
   * Record the start of a streaming operation
   */
  const recordStart = useCallback(
    (model?: string) => {
      recordMetric({
        timestamp: Date.now(),
        type: "start",
        model,
      });
    },
    [recordMetric]
  );

  /**
   * Record a chunk received during streaming
   */
  const recordChunk = useCallback(
    (tokensGenerated: number, model?: string) => {
      recordMetric({
        timestamp: Date.now(),
        type: "chunk",
        model,
        tokensGenerated,
      });
    },
    [recordMetric]
  );

  /**
   * Record the completion of a streaming operation
   */
  const recordComplete = useCallback(
    (latency: number, tokensGenerated: number, model?: string) => {
      recordMetric({
        timestamp: Date.now(),
        type: "complete",
        model,
        latency,
        tokensGenerated,
      });
    },
    [recordMetric]
  );

  /**
   * Record an error during streaming
   */
  const recordError = useCallback(
    (error: string, model?: string) => {
      recordMetric({
        timestamp: Date.now(),
        type: "error",
        model,
        error,
      });
    },
    [recordMetric]
  );

  return {
    recordMetric,
    recordStart,
    recordChunk,
    recordComplete,
    recordError,
  }
}
