import { NextRequest } from "next/server";
import { soraClient, SoraGenerationRequest } from "@/lib/sora/sora-client";
import { telemetry, generateRequestId } from "@/lib/telemetry";

export const runtime = "nodejs";

/**
 * POST /api/sora/generate
 * Request a video generation from Sora
 * Returns immediately with job ID (async processing)
 */
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { prompt, model, duration, quality, aspectRatio } = body as Partial<SoraGenerationRequest> & {
      aspectRatio?: string;
    };

    // Validate input
    if (!prompt || prompt.trim().length === 0) {
      telemetry.trackVideoResult({
        requestId,
        provider: 'sora',
        status: 'validation_error',
        latency_ms: Date.now() - startTime,
        error: 'Missing prompt'
      });
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      telemetry.trackVideoResult({
        requestId,
        provider: 'sora',
        status: 'validation_error', 
        latency_ms: Date.now() - startTime,
        error: 'Prompt too long'
      });
      return Response.json(
        { error: "Prompt too long (max 10000 chars)" },
        { status: 400 }
      );
    }

    // Track request
    telemetry.trackVideoRequest({
      requestId,
      provider: 'sora',
      prompt_length: prompt.length,
      duration,
      model,
      quality,
      aspectRatio
    });

    // Create generation request
    const request: SoraGenerationRequest = {
      prompt: prompt.trim(),
      model: (model as "sora-1" | "sora-1-hd") || "sora-1",
      duration: duration as any,
      quality: quality as any,
      aspectRatio: aspectRatio as any,
    };

    // Submit to Sora
    const job = await soraClient.generateVideo(request);

    // Track success
    telemetry.trackVideoResult({
      requestId,
      provider: 'sora',
      status: 'queued',
      latency_ms: Date.now() - startTime
    });

    return Response.json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      requestId,
      message: "Video generation queued. Check status with /api/sora/status?jobId=...",
    });
  } catch (error) {
    // Track error
    telemetry.trackVideoResult({
      requestId,
      provider: 'sora',
      status: 'error',
      latency_ms: Date.now() - startTime,
      error: (error as Error).message
    });
    
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
