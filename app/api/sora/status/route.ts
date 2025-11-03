import { NextRequest } from "next/server";
import { soraClient } from "@/lib/sora/sora-client";

export const runtime = "nodejs";

/**
 * GET /api/sora/status?jobId=...
 * Poll the status of a Sora generation job
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return Response.json(
      { error: "jobId query parameter required" },
      { status: 400 }
    );
  }

  try {
    const job = await soraClient.getJobStatus(jobId);

    if (!job) {
      return Response.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return Response.json({
      jobId: job.id,
      status: job.status,
      prompt: job.prompt,
      model: job.model,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      videoUrl: job.videoUrl,
      error: job.error,
    });
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
