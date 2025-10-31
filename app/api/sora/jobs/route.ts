import { NextRequest } from "next/server";

/**
 * GET /api/sora/jobs
 * Retrieve list of all Sora generation jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Mock jobs - in production, fetch from database or soraClient
    const mockJobs = [
      {
        id: "sora_job_001",
        prompt:
          "Create a sleek product showcase video featuring a modern laptop on a minimalist white background with soft lighting.",
        model: "sora-1-hd",
        status: "completed",
        createdAt: Date.now() - 2 * 60 * 60 * 1000,
        completedAt: Date.now() - 1.5 * 60 * 60 * 1000,
        videoUrl: "https://example.com/videos/product-showcase.mp4",
        duration: 15,
      },
      {
        id: "sora_job_002",
        prompt:
          "Animated explainer video showing how to use an AI productivity tool. Include interface walkthrough with friendly narration.",
        model: "sora-1-hd",
        status: "processing",
        createdAt: Date.now() - 30 * 60 * 1000,
        estimatedTime: 240,
      },
      {
        id: "sora_job_003",
        prompt:
          "Brand story video showing startup journey from idea to market success with team collaboration moments.",
        model: "sora-1",
        status: "queued",
        createdAt: Date.now() - 5 * 60 * 1000,
        estimatedTime: 300,
      },
      {
        id: "sora_job_004",
        prompt:
          "Holiday-themed social media teaser video with trending audio and bold text overlays for Instagram.",
        model: "sora-1",
        status: "completed",
        createdAt: Date.now() - 24 * 60 * 60 * 1000,
        completedAt: Date.now() - 23.5 * 60 * 60 * 1000,
        videoUrl: "https://example.com/videos/holiday-teaser.mp4",
        duration: 6,
      },
      {
        id: "sora_job_005",
        prompt:
          "Customer testimonial video featuring success story with before/after results.",
        model: "sora-1-hd",
        status: "failed",
        createdAt: Date.now() - 48 * 60 * 60 * 1000,
        error: "API rate limit exceeded - please retry in 1 hour",
      },
    ];

    return Response.json(mockJobs);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
