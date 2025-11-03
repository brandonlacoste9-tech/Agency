"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalGenerations: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  mostUsedModel: string;
  recentProjects: Array<{
    id: string;
    title: string;
    model: string;
    tokensUsed: number;
    createdAt: number;
    status: "success" | "failed" | "pending";
  }>;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg opacity-50">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Generations"
          value={stats?.totalGenerations || 0}
          unit="requests"
          icon="✨"
        />
        <MetricCard
          title="Success Rate"
          value={stats?.successRate || 0}
          unit="%"
          icon="✅"
        />
        <MetricCard
          title="Avg Latency"
          value={stats?.avgLatency || 0}
          unit="ms"
          icon="⚡"
        />
        <MetricCard
          title="Tokens Used"
          value={Math.round((stats?.totalTokens || 0) / 1000)}
          unit="K"
          icon="🎯"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Used Model */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold text-sm opacity-70 mb-4" style={{ color: "var(--text)" }}>
            Most Used Model
          </h3>
          <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {stats?.mostUsedModel || "—"}
          </div>
          <p className="text-xs opacity-50 mt-2" style={{ color: "var(--text)" }}>
            Primary choice for your generations
          </p>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold text-sm opacity-70 mb-4" style={{ color: "var(--text)" }}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-70 transition"
              style={{ background: "var(--bg)", color: "var(--text)" }}
            >
              ✨ Create New
            </button>
            <button
              onClick={() => router.push("/dashboard/analytics")}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-70 transition"
              style={{ background: "var(--bg)", color: "var(--text)" }}
            >
              📈 View Analytics
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold text-sm opacity-70 mb-4" style={{ color: "var(--text)" }}>
            Daily Quota
          </h3>
          <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            1.5M
          </div>
          <p className="text-xs opacity-50 mt-2" style={{ color: "var(--text)" }}>
            tokens remaining
          </p>
          <div className="mt-4 w-full bg-black/20 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: "75%",
                background: "linear-gradient(90deg, #10b981, #3b82f6)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold mb-4" style={{ color: "var(--text)" }}>
          Recent Projects
        </h3>
        <div className="space-y-2">
          {stats?.recentProjects && stats.recentProjects.length > 0 ? (
            stats.recentProjects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--bg)" }}
              >
                <div>
                  <div className="font-medium" style={{ color: "var(--text)" }}>
                    {project.title}
                  </div>
                  <div className="text-xs opacity-50" style={{ color: "var(--text)" }}>
                    {project.model} · {project.tokensUsed.toLocaleString()} tokens ·{" "}
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    project.status === "success"
                      ? "bg-green-500/20 text-green-400"
                      : project.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {project.status}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 opacity-50" style={{ color: "var(--text)" }}>
              No projects yet. <a href="/" className="underline hover:opacity-70">Create one now</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
}

function MetricCard({ title, value, unit, icon }: MetricCardProps) {
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
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}
