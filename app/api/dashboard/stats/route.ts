import { NextRequest } from "next/server";

/**
 * GET /api/dashboard/stats
 * Retrieve dashboard statistics from analytics data
 */
export async function GET(req: NextRequest) {
  try {
    // In production, fetch from database or analytics store
    // For now, return mock data with realistic structure
    const mockMetrics = [
      {
        model: "openai/gpt-4o",
        latency: 245,
        totalDuration: 2890,
        tokensGenerated: 342,
        wasAborted: false,
        status: "success",
      },
      {
        model: "openai/gpt-5",
        latency: 180,
        totalDuration: 2100,
        tokensGenerated: 421,
        wasAborted: false,
        status: "success",
      },
      {
        model: "openai/gpt-4o",
        latency: 320,
        totalDuration: 3200,
        tokensGenerated: 285,
        wasAborted: true,
        status: "aborted",
      },
    ];

    const successCount = mockMetrics.filter((m) => m.status === "success").length;
    const totalLatency = mockMetrics.reduce((sum, m) => sum + m.latency, 0);
    const totalTokens = mockMetrics.reduce(
      (sum, m) => sum + m.tokensGenerated,
      0
    );
    const modelUsage = mockMetrics.reduce(
      (acc: Record<string, number>, m) => {
        acc[m.model] = (acc[m.model] || 0) + 1;
        return acc;
      },
      {}
    );

    const mostUsedModel = Object.entries(modelUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || "openai/gpt-4o";

    return Response.json({
      totalGenerations: mockMetrics.length,
      successRate: Math.round((successCount / mockMetrics.length) * 100),
      avgLatency: Math.round(totalLatency / mockMetrics.length),
      totalTokens,
      mostUsedModel,
      recentProjects: mockMetrics.slice(0, 5).map((m, i) => ({
        id: `proj_${i}`,
        title: `Generation ${i + 1}`,
        model: m.model,
        tokensUsed: m.tokensGenerated,
        createdAt: Date.now() - (i * 60 * 60 * 1000),
        status: m.status === "success" ? "success" : m.status === "aborted" ? "pending" : "success",
      })),
    });
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
