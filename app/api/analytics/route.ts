import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface StreamingMetric {
  model: string;
  latency: number; // ms to first token
  totalDuration: number; // ms total
  tokensGenerated: number;
  wasAborted: boolean;
  timestamp: number;
  status: "success" | "error" | "aborted";
}

interface AnalyticsReport {
  totalRequests: number;
  successRate: number;
  abortRate: number;
  avgLatency: number;
  avgDuration: number;
  topModel: string;
  modelBreakdown: Record<
    string,
    {
      count: number;
      successRate: number;
      avgLatency: number;
    }
  >;
}

// In-memory store (in production, use database)
let metrics: StreamingMetric[] = [];

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate incoming metric
  const metric: StreamingMetric = {
    model: body.model ?? "unknown",
    latency: body.latency ?? 0,
    totalDuration: body.totalDuration ?? 0,
    tokensGenerated: body.tokensGenerated ?? 0,
    wasAborted: body.wasAborted ?? false,
    timestamp: Date.now(),
    status: body.status ?? "success",
  };

  metrics.push(metric);

  // Keep only last 1000 metrics (circular buffer)
  if (metrics.length > 1000) {
    metrics = metrics.slice(-1000);
  }

  return Response.json({ success: true, stored: metrics.length });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "report") {
    return getAnalyticsReport();
  }

  if (action === "reset") {
    metrics = [];
    return Response.json({ success: true, message: "Metrics cleared" });
  }

  // Default: return all metrics
  return Response.json({
    metrics,
    count: metrics.length,
  });
}

function getAnalyticsReport(): Response {
  if (metrics.length === 0) {
    return Response.json({
      totalRequests: 0,
      successRate: 0,
      abortRate: 0,
      avgLatency: 0,
      avgDuration: 0,
      topModel: "N/A",
      modelBreakdown: {},
    });
  }

  const totalRequests = metrics.length;
  const successes = metrics.filter((m) => m.status === "success").length;
  const aborts = metrics.filter((m) => m.wasAborted).length;

  const avgLatency =
    metrics.reduce((sum, m) => sum + m.latency, 0) / totalRequests;
  const avgDuration =
    metrics.reduce((sum, m) => sum + m.totalDuration, 0) / totalRequests;

  // Model breakdown
  const modelMap = new Map<
    string,
    {
      count: number;
      successes: number;
      totalLatency: number;
    }
  >();

  metrics.forEach((m) => {
    const current = modelMap.get(m.model) || {
      count: 0,
      successes: 0,
      totalLatency: 0,
    };
    current.count++;
    if (m.status === "success") current.successes++;
    current.totalLatency += m.latency;
    modelMap.set(m.model, current);
  });

  const modelBreakdown: Record<
    string,
    {
      count: number;
      successRate: number;
      avgLatency: number;
    }
  > = {};

  let topModel = "N/A";
  let topCount = 0;

  modelMap.forEach((data, model) => {
    modelBreakdown[model] = {
      count: data.count,
      successRate: Math.round((data.successes / data.count) * 100),
      avgLatency: Math.round(data.totalLatency / data.count),
    };

    if (data.count > topCount) {
      topCount = data.count;
      topModel = model;
    }
  });

  const report: AnalyticsReport = {
    totalRequests,
    successRate: Math.round((successes / totalRequests) * 100),
    abortRate: Math.round((aborts / totalRequests) * 100),
    avgLatency: Math.round(avgLatency),
    avgDuration: Math.round(avgDuration),
    topModel,
    modelBreakdown,
  };

  return Response.json(report);
}
