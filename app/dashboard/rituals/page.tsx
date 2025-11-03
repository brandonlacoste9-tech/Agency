"use client";

import { useState, useEffect } from "react";

interface RitualData {
  badge: {
    activeAgents: number;
    totalCredentials: number;
    escalationsToday: number;
    unauthorizedAttempts: number;
  };
  metrics: {
    successRate: number;
    avgLatency: number;
    totalRequests: number;
    alertsActive: number;
  };
  echo: {
    patternsDiscovered: number;
    successPatterns: number;
    patternUses: number;
    avgPatternConfidence: number;
  };
  history: {
    projectsTracked: number;
    seasonalInsights: number;
    recommendations: number;
    historicalAccuracy: number;
  };
}

export default function RitualsPage() {
  const [ritualData, setRitualData] = useState<RitualData | null>(null);
  const [activeRitual, setActiveRitual] = useState<"badge" | "metrics" | "echo" | "history">("badge");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockData: RitualData = {
      badge: {
        activeAgents: 5,
        totalCredentials: 12,
        escalationsToday: 3,
        unauthorizedAttempts: 0
      },
      metrics: {
        successRate: 94.2,
        avgLatency: 185,
        totalRequests: 1547,
        alertsActive: 1
      },
      echo: {
        patternsDiscovered: 34,
        successPatterns: 28,
        patternUses: 892,
        avgPatternConfidence: 87
      },
      history: {
        projectsTracked: 12,
        seasonalInsights: 8,
        recommendations: 24,
        historicalAccuracy: 91
      }
    };
    setRitualData(mockData);
    setLoading(false);
  }, []);

  if (loading || !ritualData) {
    return <div>Loading ritual data...</div>;
  }

  const rituals = [
    {
      id: "badge",
      name: "Badge Ritual",
      emoji: "🎖️",
      description: "Agent credentialing & permission gating",
      color: "from-blue-500/10 to-blue-500/5"
    },
    {
      id: "metrics",
      name: "Metrics Ritual",
      emoji: "📊",
      description: "Continuous monitoring & threshold optimization",
      color: "from-green-500/10 to-green-500/5"
    },
    {
      id: "echo",
      name: "Echo Ritual",
      emoji: "🔊",
      description: "Learn from past, extract patterns",
      color: "from-purple-500/10 to-purple-500/5"
    },
    {
      id: "history",
      name: "History Ritual",
      emoji: "📖",
      description: "Persistent memory across sessions",
      color: "from-orange-500/10 to-orange-500/5"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
          BeeHive Codex Rituals
        </h1>
        <p className="opacity-70" style={{ color: "var(--text)" }}>
          Real-time visualization of all four rituals in action
        </p>
      </div>

      {/* Ritual Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {rituals.map((ritual) => (
          <button
            key={ritual.id}
            onClick={() => setActiveRitual(ritual.id as any)}
            className={`p-4 rounded-xl border transition-all ${
              activeRitual === ritual.id ? "ring-2 ring-blue-500" : ""
            } bg-gradient-to-br ${ritual.color}`}
            style={{ borderColor: "var(--border)" }}
          >
            <div className="text-3xl mb-2">{ritual.emoji}</div>
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              {ritual.name}
            </h3>
            <p className="text-xs opacity-60 mt-1" style={{ color: "var(--text)" }}>
              {ritual.description}
            </p>
          </button>
        ))}
      </div>

      {/* Badge Ritual Details */}
      {activeRitual === "badge" && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
            🎖️ Badge Ritual: Agent Credentialing & Permission Gating
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox label="Active Agents" value={ritualData.badge.activeAgents} icon="🤖" />
            <StatBox label="Credentials" value={ritualData.badge.totalCredentials} icon="🔑" />
            <StatBox
              label="Escalations Today"
              value={ritualData.badge.escalationsToday}
              icon="⬆️"
            />
            <StatBox label="Blocked Attempts" value={ritualData.badge.unauthorizedAttempts} icon="🚫" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Active Agent Credentials
              </h3>
              <div className="space-y-2">
                {[
                  { name: "Content Generator", status: "✓", tools: 4 },
                  { name: "Video Prompter", status: "✓", tools: 3 },
                  { name: "Analytics Agent", status: "✓", tools: 3 },
                  { name: "Research Agent", status: "✓", tools: 2 },
                  { name: "Publishing Agent", status: "⏸", tools: 1 }
                ].map((agent) => (
                  <div
                    key={agent.name}
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ background: "var(--bg)" }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: "var(--text)" }}>
                        {agent.name}
                      </div>
                      <div className="text-xs opacity-50" style={{ color: "var(--text)" }}>
                        {agent.tools} tools granted
                      </div>
                    </div>
                    <span className={agent.status === "✓" ? "text-green-400" : "text-yellow-400"}>
                      {agent.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Escalation Levels Today
              </h3>
              <div className="space-y-3">
                {[
                  { level: "Level 1 (Auto-Execute)", count: 892, color: "green" },
                  { level: "Level 2 (Notify)", count: 245, color: "blue" },
                  { level: "Level 3 (Approve)", count: 8, color: "orange" },
                  { level: "Level 4 (Human-Only)", count: 1, color: "red" }
                ].map((esc) => (
                  <div key={esc.level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "var(--text)" }}>{esc.level}</span>
                      <span className="font-mono opacity-70" style={{ color: "var(--text)" }}>
                        {esc.count}
                      </span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(esc.count / 892) * 100}%`,
                          background:
                            esc.color === "green"
                              ? "#10b981"
                              : esc.color === "blue"
                                ? "#3b82f6"
                                : esc.color === "orange"
                                  ? "#f59e0b"
                                  : "#ef4444"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Ritual Details */}
      {activeRitual === "metrics" && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
            📊 Metrics Ritual: Continuous Monitoring & Optimization
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox label="Success Rate" value={ritualData.metrics.successRate} suffix="%" icon="✅" />
            <StatBox label="Avg Latency" value={ritualData.metrics.avgLatency} suffix="ms" icon="⚡" />
            <StatBox label="Total Requests" value={ritualData.metrics.totalRequests} icon="📈" />
            <StatBox label="Active Alerts" value={ritualData.metrics.alertsActive} icon="🚨" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Threshold Triggers
              </h3>
              <div className="space-y-2">
                {[
                  { name: "Success Rate", value: 94.2, threshold: 95, status: "warning" },
                  { name: "Cost Budget", value: 83, threshold: 90, status: "ok" },
                  { name: "Error Rate", value: 3.2, threshold: 10, status: "ok" },
                  { name: "Latency p99", value: 412, threshold: 500, status: "ok" }
                ].map((metric) => (
                  <div
                    key={metric.name}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {metric.name}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          metric.status === "warning"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {metric.status === "warning" ? "⚠" : "✓"}
                      </span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%`,
                          background:
                            metric.status === "warning"
                              ? "#f59e0b"
                              : "#10b981"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Automation Actions
              </h3>
              <div className="space-y-2">
                {[
                  { action: "Cost exceeded 80%", triggered: "Scale back to gpt-3.5" },
                  { action: "Error rate spike", triggered: "Increased human review rate" },
                  { action: "Success rate high", triggered: "Expand to more tasks" },
                  { action: "Latency improved", triggered: "Adjust SLA upward" }
                ].map((auto, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                      {auto.action}
                    </div>
                    <div className="text-xs opacity-60" style={{ color: "var(--text)" }}>
                      → {auto.triggered}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Echo Ritual Details */}
      {activeRitual === "echo" && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
            🔊 Echo Ritual: Learning & Pattern Extraction
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox label="Patterns Discovered" value={ritualData.echo.patternsDiscovered} icon="🎯" />
            <StatBox label="Success Patterns" value={ritualData.echo.successPatterns} icon="⭐" />
            <StatBox label="Pattern Uses" value={ritualData.echo.patternUses} icon="🔄" />
            <StatBox
              label="Avg Confidence"
              value={ritualData.echo.avgPatternConfidence}
              suffix="%"
              icon="📈"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Top Patterns
              </h3>
              <div className="space-y-2">
                {[
                  { pattern: "Benefit-driven headlines", success: 94, uses: 234 },
                  { pattern: "2-line format with verbs", success: 91, uses: 203 },
                  { pattern: "Sustainability angle", success: 89, uses: 178 },
                  { pattern: "15-30s video format", success: 87, uses: 156 },
                  { pattern: "Early morning timing", success: 85, uses: 142 }
                ].map((p) => (
                  <div
                    key={p.pattern}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                        {p.pattern}
                      </span>
                      <span className="text-xs opacity-60" style={{ color: "var(--text)" }}>
                        {p.uses} uses
                      </span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${p.success}%`,
                          background: "linear-gradient(90deg, #10b981, #3b82f6)"
                        }}
                      />
                    </div>
                    <div className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
                      Success rate: {p.success}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Learning Velocity
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: "var(--text)" }}>Week 1</span>
                    <span className="font-mono" style={{ color: "var(--text)" }}>
                      60% success
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: "60%", background: "#ef4444" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: "var(--text)" }}>Week 2</span>
                    <span className="font-mono" style={{ color: "var(--text)" }}>
                      76% success
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: "76%", background: "#f59e0b" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: "var(--text)" }}>Week 3</span>
                    <span className="font-mono" style={{ color: "var(--text)" }}>
                      85% success
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: "85%", background: "#84cc16" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: "var(--text)" }}>Week 4</span>
                    <span className="font-mono" style={{ color: "var(--text)" }}>
                      94% success
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: "94%", background: "#10b981" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Ritual Details */}
      {activeRitual === "history" && (
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
            📖 History Ritual: Persistent Memory & Recommendations
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox label="Projects Tracked" value={ritualData.history.projectsTracked} icon="🎬" />
            <StatBox label="Seasonal Insights" value={ritualData.history.seasonalInsights} icon="🌍" />
            <StatBox label="Recommendations" value={ritualData.history.recommendations} icon="💡" />
            <StatBox label="Accuracy" value={ritualData.history.historicalAccuracy} suffix="%" icon="🎯" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Seasonal Patterns Learned
              </h3>
              <div className="space-y-2">
                {[
                  { season: "Q1", multiplier: 1.0, confidence: 85 },
                  { season: "Q2", multiplier: 0.85, confidence: 82 },
                  { season: "Q3", multiplier: 1.2, confidence: 78 },
                  { season: "Q4", multiplier: 1.4, confidence: 91 }
                ].map((s) => (
                  <div
                    key={s.season}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {s.season}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-mono" style={{ color: "var(--text)" }}>
                          {s.multiplier}x multiplier
                        </div>
                        <div className="text-xs opacity-50" style={{ color: "var(--text)" }}>
                          {s.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
                Next Period Recommendations
              </h3>
              <div className="space-y-2">
                {[
                  {
                    period: "Next Month",
                    rec: "Increase video budget 50% (historical trend)",
                    impact: "+25% engagement expected"
                  },
                  {
                    period: "Next Quarter",
                    rec: "Launch Q4 campaign in September (learned timing)",
                    impact: "+40% early-mover advantage"
                  },
                  {
                    period: "Next Year",
                    rec: "Replicate Q4 2024 strategy (proven success)",
                    impact: "$50K revenue projected"
                  }
                ].map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
                      {r.period}
                    </div>
                    <div className="text-xs opacity-70 mb-2" style={{ color: "var(--text)" }}>
                      {r.rec}
                    </div>
                    <div className="text-xs text-green-400 font-semibold">{r.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  suffix = "",
  icon
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      <p className="text-xs opacity-70 mb-2" style={{ color: "var(--text)" }}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          {value}
          <span className="text-sm opacity-60">{suffix}</span>
        </p>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}
