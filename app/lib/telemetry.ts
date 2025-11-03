/**
 * Simple telemetry utility for tracking video generation events
 * Fire-and-forget approach to avoid blocking request processing
 */

export interface TelemetryEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: number;
}

export interface VideoGenerationRequestEvent {
  requestId: string;
  provider: 'longcat' | 'sora';
  prompt_length: number;
  duration?: number;
  model?: string;
  quality?: string;
  aspectRatio?: string;
}

export interface VideoGenerationResultEvent {
  requestId: string;
  provider: 'longcat' | 'sora';
  status: string;
  latency_ms: number;
  error?: string;
}

class TelemetryClient {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.ENABLE_TELEMETRY !== 'false';
  }

  /**
   * Track an event - fire and forget, never throw
   */
  track(event: string, properties: Record<string, any>): void {
    if (!this.isEnabled) return;

    // Fire and forget - don't await this
    this.sendEvent({
      event,
      properties,
      timestamp: Date.now()
    }).catch((error) => {
      // Silent fail - telemetry should never break the app
      if (process.env.DEBUG_TELEMETRY === 'true') {
        console.warn('Telemetry error:', error);
      }
    });
  }

  /**
   * Track video generation request
   */
  trackVideoRequest(data: VideoGenerationRequestEvent): void {
    this.track('video_generation_request', data);
  }

  /**
   * Track video generation result
   */
  trackVideoResult(data: VideoGenerationResultEvent): void {
    this.track('video_generation_result', data);
  }

  /**
   * Send event to telemetry backend
   * Override this method to integrate with your telemetry service
   */
  private async sendEvent(event: TelemetryEvent): Promise<void> {
    // Default implementation: log to console in debug mode
    if (process.env.DEBUG_TELEMETRY === 'true') {
      console.log('📊 Telemetry:', JSON.stringify(event, null, 2));
    }

    // TODO: Integrate with your telemetry service (Supabase, Datadog, etc.)
    // Example integrations:
    
    // Supabase:
    // await supabase.from('telemetry_events').insert(event);
    
    // HTTP endpoint:
    // await fetch('/api/telemetry', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
    
    // Third-party service:
    // await analytics.track(event.event, event.properties);
  }
}

// Export singleton instance
export const telemetry = new TelemetryClient();

/**
 * Utility to generate correlation IDs for request tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}