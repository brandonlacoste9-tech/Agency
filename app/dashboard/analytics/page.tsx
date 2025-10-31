"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  totalRequests: number;
  successRate: number;
  abortRate: number;
  avgLatency: number;
  avgDuration: number;
  modelBreakdown: {
    model: string;
    requests: number;
    successRate: number;
    avgLatency: number;
  }[];
  dailyTrends: {
    date: string;
    requests: number;
    avgLatency: number;
    tokens: number;
  }[];
  latencyDistribution: {
    bucket: string;
    count: number;
  }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics?action=report&range=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg opacity-50">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          Performance Analytics
        </h1>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range ? "opacity-100" : "opacity-50 hover:opacity-70"
              }`}
              style={{
                background: timeRange === range ? "var(--accent)" : "transparent",
                color: "var(--text)",
                border: `1px solid var(--border)`,
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsMetric
          title="Total Requests"
          value={analytics?.totalRequests || 0}
          unit="requests"
          icon="📊"
          change={12}
        />
        <AnalyticsMetric
          title="Success Rate"
          value={analytics?.successRate || 0}
          unit="%"
          icon="✅"
          change={5}
        />
        <AnalyticsMetric
          title="Avg Latency"
          value={Math.round(analytics?.avgLatency || 0)}
          unit="ms"
          icon="⚡"
          change={-8}
        />
        <AnalyticsMetric
          title="Abort Rate"
          value={analytics?.abortRate || 0}
          unit="%"
          icon="⛔"
          change={-3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
            Model Performance
          </h2>
          <div className="space-y-4">
            {analytics?.modelBreakdown && analytics.modelBreakdown.length > 0 ? (
              analytics.modelBreakdown.map((model) => (
                <div key={model.model} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--text)" }}>{model.model}</span>
                    <span className="opacity-70" style={{ color: "var(--text)" }}>
                      {model.requests} requests · {model.successRate}% success
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${model.successRate}%`,
                        background: `hsl(${120 - (100 - model.successRate)}, 70%, 50%)`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="opacity-50" style={{ color: "var(--text)" }}>
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Latency Distribution */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
            Latency Distribution
          </h2>
          <div className="space-y-3">
            {analytics?.latencyDistribution && analytics.latencyDistribution.length > 0 ? (
              analytics.latencyDistribution.map((bucket) => {
                const maxCount = Math.max(
                  ...analytics.latencyDistribution.map((b) => b.count)
                );
                return (
                  <div key={bucket.bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text)" }}>{bucket.bucket}</span>
                      <span className="opacity-70" style={{ color: "var(--text)" }}>
                        {bucket.count}
                      </span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(bucket.count / maxCount) * 100}%`,
                          background: "linear-gradient(90deg, #10b981, #3b82f6)",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="opacity-50" style={{ color: "var(--text)" }}>
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Daily Trends
        </h2>
        {analytics?.dailyTrends && analytics.dailyTrends.length > 0 ? (
          <div className="space-y-4">
            {analytics.dailyTrends.slice(-7).map((day) => (
              <div key={day.date} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text)" }}>
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-4 text-xs opacity-70" style={{ color: "var(--text)" }}>
                    <span>{day.requests} requests</span>
                    <span>{day.avgLatency}ms avg latency</span>
                    <span>{Math.round(day.tokens / 1000)}K tokens</span>
                  </div>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(day.requests / 100) * 100}%`,
                      background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="opacity-50" style={{ color: "var(--text)" }}>
            No data available yet
          </div>
        )}
      </div>

      {/* Cost Analysis */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Cost Analysis
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm opacity-70" style={{ color: "var(--text)" }}>
              Estimated Cost
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "var(--text)" }}>
              $2.45
            </div>
            <div className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
              This period
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70" style={{ color: "var(--text)" }}>
              Cost per 1K Tokens
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "var(--text)" }}>
              $0.002
            </div>
            <div className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
              Average rate
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70" style={{ color: "var(--text)" }}>
              Monthly Projection
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "var(--text)" }}>
              $34.50
            </div>
            <div className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
              At current rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsMetricProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
  change: number;
}

function AnalyticsMetric({ title, value, unit, icon, change }: AnalyticsMetricProps) {
  const isPositive = (change > 0 && unit === "%") || (change < 0 && unit === "ms");

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
            {title}
          </p>
          <div className="text-2xl font-bold mt-2" style={{ color: "var(--text)" }}>
            {value.toLocaleString()}
            <span className="text-sm opacity-50 ml-1">{unit}</span>
          </div>
          <div className={`text-xs mt-2 ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "↑" : "↓"} {Math.abs(change)}% from last period
          </div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}
