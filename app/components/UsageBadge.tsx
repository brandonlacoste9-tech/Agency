"use client";

import { useEffect, useState } from "react";

interface UsageData {
  model: string;
  totalTokens: number;
  todayTokens: number;
  dailyLimit: number;
  percentageUsed: number;
  remainingTokens: number;
}

export default function UsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/usage?model=openai/gpt-5");
        if (res.ok) {
          const data: UsageData = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !usage) {
    return null;
  }

  const getColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-400";
    return "bg-green-500";
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
      title={`${usage.todayTokens} / ${usage.dailyLimit} tokens used today`}
    >
      <div className="flex items-center gap-1 text-xs">
        <span className="opacity-70">Usage:</span>
        <span className="font-mono font-semibold">
          {usage.percentageUsed}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-20 h-1.5 bg-gray-300 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getColor(usage.percentageUsed)}`}
          style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
        />
      </div>

      {/* Remaining tokens */}
      <span className="text-xs opacity-70">
        {formatTokens(usage.remainingTokens)} left
      </span>
    </div>
  );
}
