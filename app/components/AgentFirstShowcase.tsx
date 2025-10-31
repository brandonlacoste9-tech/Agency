"use client";

import { useState } from "react";

export default function AgentFirstShowcase() {
  const [activeTab, setActiveTab] = useState<"armies" | "context" | "operator">("armies");

  const pillars = [
    {
      id: "armies",
      title: "Agent Armies",
      description: "Specialized agents in swarms, not monolithic AI",
      icon: "🐝",
      features: [
        "Domain-specific expertise",
        "Fault isolation & resilience",
        "Horizontal scaling",
        "Independent testing",
        "Transparent reasoning"
      ],
      example: "Content Agent + Video Agent + Analytics Agent orchestrated by Chief Agent"
    },
    {
      id: "context",
      title: "Context Engineering",
      description: "Living playbooks that evolve, not static prompts",
      icon: "📚",
      features: [
        "Dynamic context windows",
        "ACE-style learning patterns",
        "Automatic playbook updates",
        "No context collapse",
        "Exponential improvement"
      ],
      example: "First generation: 60% success. By week 4: 94% success from learned patterns."
    },
    {
      id: "operator",
      title: "Operator-in-the-Loop",
      description: "Human approval gates, not blind automation",
      icon: "🔐",
      features: [
        "Risk-based escalation",
        "Complete audit trails",
        "Permission gating",
        "Strategic human judgment",
        "Regulatory compliance"
      ],
      example: "Low-risk actions: auto-execute. High-risk: require operator approval."
    }
  ];

  const rituals = [
    {
      name: "Badge Ritual",
      emoji: "🎖️",
      purpose: "Agent credentialing & permission gating",
      color: "from-blue-500/10 to-blue-500/5"
    },
    {
      name: "Metrics Ritual",
      emoji: "📊",
      purpose: "Continuous monitoring & threshold optimization",
      color: "from-green-500/10 to-green-500/5"
    },
    {
      name: "Echo Ritual",
      emoji: "🔊",
      purpose: "Learn from past, extract patterns",
      color: "from-purple-500/10 to-purple-500/5"
    },
    {
      name: "History Ritual",
      emoji: "📖",
      purpose: "Persistent memory across sessions",
      color: "from-orange-500/10 to-orange-500/5"
    }
  ];

  const activePillar = pillars.find((p) => p.id === activeTab) || pillars[0];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4" style={{ color: "var(--text)" }}>
            Agent-First Philosophy
          </h2>
          <p className="text-xl opacity-70 max-w-2xl mx-auto mb-6" style={{ color: "var(--text)" }}>
            Built on David Ondrej's proven methodologies: specialized agent swarms + context engineering + human oversight
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/docs/AGENT_FIRST_PHILOSOPHY.md"
              className="px-6 py-2 rounded-lg font-medium transition"
              style={{
                background: "var(--accent)",
                color: "var(--text)"
              }}
            >
              📖 Read Philosophy
            </a>
            <a
              href="/docs/AGENT_ORCHESTRATION.md"
              className="px-6 py-2 rounded-lg font-medium transition border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text)"
              }}
            >
              🛠️ Integration Guide
            </a>
          </div>
        </div>

        {/* Three Pillars */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            Three Pillars of Excellence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                onClick={() => setActiveTab(pillar.id as any)}
                className={`p-6 rounded-xl border transition-all cursor-pointer ${
                  activeTab === pillar.id ? "ring-2 ring-blue-500" : ""
                }`}
                style={{
                  background: "var(--card)",
                  borderColor: activeTab === pillar.id ? "var(--accent)" : "var(--border)"
                }}
              >
                <div className="text-4xl mb-3">{pillar.icon}</div>
                <h4 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
                  {pillar.title}
                </h4>
                <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
                  {pillar.description}
                </p>
              </button>
            ))}
          </div>

          {/* Active Pillar Details */}
          <div
            className="rounded-xl border p-8"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
                  {activePillar.title}: Features
                </h4>
                <ul className="space-y-2">
                  {activePillar.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span style={{ color: "var(--text)" }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
                  Real-World Example
                </h4>
                <div
                  className="p-4 rounded-lg text-sm"
                  style={{ background: "var(--bg)", color: "var(--text)" }}
                >
                  {activePillar.example}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BeeHive Codex Rituals */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            BeeHive Codex Rituals
          </h3>
          <p className="text-center opacity-70 mb-12 max-w-2xl mx-auto" style={{ color: "var(--text)" }}>
            Four interconnected rituals that operationalize agent workflows: Trust, Monitor, Learn, Remember
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rituals.map((ritual) => (
              <a
                key={ritual.name}
                href="/docs/BEEHIVE_RITUALS.md"
                className={`p-6 rounded-xl border transition-all hover:scale-105 cursor-pointer bg-gradient-to-br ${ritual.color}`}
                style={{ borderColor: "var(--border)" }}
              >
                <div className="text-4xl mb-2">{ritual.emoji}</div>
                <h4 className="font-bold mb-1" style={{ color: "var(--text)" }}>
                  {ritual.name}
                </h4>
                <p className="text-xs opacity-70" style={{ color: "var(--text)" }}>
                  {ritual.purpose}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div>
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            Built on Best-in-Class Tools
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "CrewAI", icon: "🦅", desc: "Multi-agent orchestration" },
              { name: "MCP", icon: "🔌", desc: "Tool integration protocol" },
              { name: "n8n", icon: "⚙️", desc: "Visual workflows" },
              { name: "LangGraph", icon: "🔗", desc: "State management" },
              { name: "Netlify Runners", icon: "🚀", desc: "Production deployment" },
              { name: "OpenAI", icon: "🤖", desc: "Foundation models" },
              { name: "Anthropic", icon: "🧠", desc: "Long context reasoning" },
              { name: "Permit.io", icon: "🔐", desc: "Access control" }
            ].map((tool) => (
              <div
                key={tool.name}
                className="p-4 rounded-lg border text-center"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="text-3xl mb-2">{tool.icon}</div>
                <h4 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {tool.name}
                </h4>
                <p className="text-xs opacity-60 mt-1" style={{ color: "var(--text)" }}>
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg opacity-70 mb-6" style={{ color: "var(--text)" }}>
            Ready to experience agent-first AI?
          </p>
          <a
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-lg font-bold text-lg transition hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "var(--text)"
            }}
          >
            Enter Creator Studio →
          </a>
        </div>
      </div>
    </section>
  );
}
