"use client";

import { useState, useEffect } from "react";

interface AgentMetrics {
  agentId: string;
  name: string;
  totalExecutions: number;
  successRate: number;
  avgLatency: number;
  totalCost: number;
  avgRating: number;
  lastExecution: string;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "pending";
  latency: number;
  tokens: number;
  cost: number;
  rating: number;
}

export default function AgentPerformancePage() {
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentMetrics = async () => {
      try {
        // In production, fetch from /api/agents/performance
        const mockAgents: AgentMetrics[] = [
          {
            agentId: "content-gen-v1",
            name: "Content Generator",
            totalExecutions: 1547,
            successRate: 94.2,
            avgLatency: 185,
            totalCost: 1245.67,
            avgRating: 4.7,
            lastExecution: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            trend: "up",
            trendPercentage: 12
          },
          {
            agentId: "video-prompt-v1",
            name: "Video Prompter",
            totalExecutions: 342,
            successRate: 87.8,
            avgLatency: 245,
            totalCost: 567.89,
            avgRating: 4.5,
            lastExecution: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            trend: "up",
            trendPercentage: 8
          },
          {
            agentId: "analytics-v1",
            name: "Analytics Agent",
            totalExecutions: 892,
            successRate: 99.1,
            avgLatency: 120,
            totalCost: 234.56,
            avgRating: 4.8,
            lastExecution: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            trend: "stable",
            trendPercentage: 2
          }
        ];

        setAgents(mockAgents);
        if (mockAgents.length > 0) {
          setSelectedAgent(mockAgents[0].agentId);
        }
      } catch (error) {
        console.error("Failed to fetch agent metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentMetrics();
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;

    const mockExecutions: ExecutionLog[] = Array.from({ length: 20 }, (_, i) => ({
      id: `exec_${i}`,
      timestamp: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
      status: Math.random() > 0.05 ? "success" : "failed",
      latency: Math.floor(150 + Math.random() * 100),
      tokens: Math.floor(1000 + Math.random() * 3000),
      cost: Math.random() * 0.1,
      rating: Math.floor(4 + Math.random() * 2)
    }));

    setExecutions(mockExecutions);
  }, [selectedAgent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg opacity-50">Loading agent performance data...</div>
      </div>
    );
  }

  const selectedAgentData = agents.find((a) => a.agentId === selectedAgent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Agent Performance Dashboard
        </h1>
        <p className="opacity-70" style={{ color: "var(--text)" }}>
          Track real-time performance metrics for all agents
        </p>
      </div>

      {/* Time Range Filter */}
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
              border: `1px solid var(--border)`
            }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.agentId}
            onClick={() => setSelectedAgent(agent.agentId)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedAgent === agent.agentId ? "ring-2 ring-blue-500" : ""
            }`}
            style={{
              background: "var(--card)",
              borderColor: selectedAgent === agent.agentId ? "var(--accent)" : "var(--border)"
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold" style={{ color: "var(--text)" }}>
                  {agent.name}
                </h3>
                <p className="text-xs opacity-50" style={{ color: "var(--text)" }}>
                  {agent.agentId}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  agent.trend === "up"
                    ? "bg-green-500/20 text-green-400"
                    : agent.trend === "down"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {agent.trend === "up" ? "↑" : agent.trend === "down" ? "↓" : "→"} {agent.trendPercentage}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70" style={{ color: "var(--text)" }}>
                  Success Rate
                </span>
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  {agent.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${agent.successRate}%`,
                    background: `hsl(${120 - (100 - agent.successRate)}, 70%, 50%)`
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Agent Details */}
      {selectedAgentData && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
            {selectedAgentData.name} — Detailed Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricBox
              label="Total Executions"
              value={selectedAgentData.totalExecutions}
              unit="requests"
              icon="📊"
            />
            <MetricBox
              label="Success Rate"
              value={selectedAgentData.successRate}
              unit="%"
              icon="✅"
            />
            <MetricBox
              label="Avg Latency"
              value={selectedAgentData.avgLatency}
              unit="ms"
              icon="⚡"
            />
            <MetricBox
              label="User Rating"
              value={selectedAgentData.avgRating}
              unit="/5"
              icon="⭐"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Cost Analysis */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Cost Analysis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Total Cost ({timeRange})
                  </span>
                  <span className="font-mono" style={{ color: "var(--text)" }}>
                    ${selectedAgentData.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Cost per Execution
                  </span>
                  <span className="font-mono" style={{ color: "var(--text)" }}>
                    ${(selectedAgentData.totalCost / selectedAgentData.totalExecutions).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Monthly Projection
                  </span>
                  <span className="font-mono font-bold" style={{ color: "var(--text)" }}>
                    ${(selectedAgentData.totalCost * 30).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Status
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400">
                    ✓ Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Last Execution
                  </span>
                  <span className="text-xs" style={{ color: "var(--text)" }}>
                    {new Date(selectedAgentData.lastExecution).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70" style={{ color: "var(--text)" }}>
                    Uptime
                  </span>
                  <span className="text-xs" style={{ color: "var(--text)" }}>
                    99.8%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution History */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold mb-4" style={{ color: "var(--text)" }}>
          Execution History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text)" }}>
                  Timestamp
                </th>
                <th className="text-left py-2 px-3" style={{ color: "var(--text)" }}>
                  Status
                </th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text)" }}>
                  Latency
                </th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text)" }}>
                  Tokens
                </th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text)" }}>
                  Cost
                </th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text)" }}>
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={exec.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 px-3" style={{ color: "var(--text)" }}>
                    {new Date(exec.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        exec.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {exec.status === "success" ? "✓" : "✗"} {exec.status}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 font-mono opacity-70" style={{ color: "var(--text)" }}>
                    {exec.latency}ms
                  </td>
                  <td className="text-right py-2 px-3 font-mono opacity-70" style={{ color: "var(--text)" }}>
                    {exec.tokens.toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 font-mono opacity-70" style={{ color: "var(--text)" }}>
                    ${exec.cost.toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3" style={{ color: "var(--text)" }}>
                    {exec.rating >= 4.5 ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  unit,
  icon
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs opacity-70" style={{ color: "var(--text)" }}>
            {label}
          </p>
          <p className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>
            {typeof value === "number" ? value.toFixed(1) : value}
            <span className="text-xs opacity-50 ml-1">{unit}</span>
          </p>
        </div>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}
