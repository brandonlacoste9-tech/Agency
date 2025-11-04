import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UsageData {
  model: string;
  totalTokens: number;
  todayTokens: number;
  dailyLimit: number;
  percentageUsed: number;
  remainingTokens: number;
}

// In-memory store (production: use database)
interface StoredUsage {
  model: string;
  tokens: number;
  timestamp: number;
}

let usageLog: StoredUsage[] = [];

const DEFAULT_LIMITS: Record<string, number> = {
  "openai/gpt-5": 1000000,
  "openai/gpt-4o": 500000,
};

export async function POST(req: NextRequest) {
  try {
    const { model, tokens } = await req.json();

    if (!model || !tokens) {
      return Response.json(
        { error: "Missing model or tokens" },
        { status: 400 }
      );
    }

    // Record usage
    usageLog.push({
      model,
      tokens,
      timestamp: Date.now(),
    });

    // Keep recent logs only (last 10000 entries)
    if (usageLog.length > 10000) {
      usageLog = usageLog.slice(-10000);
    }

    return Response.json({ success: true, logged: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to log usage" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  // If specific model requested
  if (model) {
    const stats = getModelStats(model);
    return Response.json(stats);
  }

  // All models
  const allModels = Object.keys(DEFAULT_LIMITS);
  const allStats = allModels.map((m) => getModelStats(m));

  return Response.json({
    models: allStats,
    totalTokens: allStats.reduce((sum, s) => sum + s.totalTokens, 0),
    timestamp: Date.now(),
  });
}

function getModelStats(model: string): UsageData {
  const limit = DEFAULT_LIMITS[model] || 1000000;
  const today = new Date().toDateString();

  // Single pass through logs for better performance
  let totalTokens = 0;
  let todayTokens = 0;

  for (const log of usageLog) {
    if (log.model === model) {
      totalTokens += log.tokens;
      if (new Date(log.timestamp).toDateString() === today) {
        todayTokens += log.tokens;
      }
    }
  }

  const percentageUsed = Math.min(100, Math.round((todayTokens / limit) * 100));
  const remainingTokens = Math.max(0, limit - todayTokens);

  return {
    model,
    totalTokens,
    todayTokens,
    dailyLimit: limit,
    percentageUsed,
    remainingTokens,
  };
}

// Admin endpoint to reset (for testing)
export async function DELETE(req: NextRequest) {
  usageLog = [];
  return Response.json({ success: true, message: "Usage log cleared" });
}
