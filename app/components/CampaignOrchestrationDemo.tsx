// ...existing code (single, latest version of the component retained; duplicate removed)...
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function CampaignOrchestrationDemo() {
  const [activeModel, setActiveModel] = useState(0);

  const models = [
    {
      name: "Kimi-Linear",
      icon: "🧠",
      role: "Strategic Planning",
      description: "Advanced strategic planning and market analysis with linear thought processing",
      output: "Campaign strategy & market positioning"
    },
    {
      name: "DeepSeek-R1",
      icon: "🔍",
      role: "Deep Research",
      description: "Comprehensive market research and competitive analysis",
      output: "Market insights & competitor analysis"
    },
    {
      name: "GPT-4o",
      icon: "✍️",
      role: "Copywriting",
      description: "High-quality ad copy and content generation",
      output: "Ad copy & messaging"
    },
    {
      name: "Claude 3.5",
      icon: "📝",
      role: "Content Refinement",
      description: "Content polishing and tone optimization",
      output: "Refined content & brand voice"
    },
    {
      name: "Gemini-2.0",
      icon: "🎨",
      role: "Creative Direction",
      description: "Visual concepts and creative direction",
      output: "Creative briefs & concepts"
    },
    {
      name: "DALL-E 3",
      icon: "🖼️",
      role: "Image Generation",
      description: "High-quality image generation for ads",
      output: "Marketing images"
    },
    {
      name: "Midjourney",
      icon: "🎭",
      role: "Artistic Images",
      description: "Artistic and stylized visuals",
      output: "Brand imagery"
    },
    {
      name: "Stable Diffusion",
      icon: "⚡",
      role: "Rapid Iteration",
      description: "Fast image iterations and variations",
      output: "Image variations"
    },
    {
      name: "Sora",
      icon: "🎬",
      role: "Video Creation",
      description: "AI-powered video generation",
      output: "Marketing videos"
    },
    {
      name: "Runway ML",
      icon: "🎞️",
      role: "Video Editing",
      description: "AI video editing and effects",
      output: "Edited video content"
    },
    {
      name: "ElevenLabs",
      icon: "🎙️",
      role: "Voice & Audio",
      description: "AI voice generation and audio production",
      output: "Voiceovers & audio"
    }
  ];

  const platforms = [
    { name: "Instagram", icon: "📷", status: "live" },
    { name: "TikTok", icon: "🎵", status: "live" },
    { name: "YouTube", icon: "📺", status: "live" },
    { name: "Facebook", icon: "👥", status: "live" },
    { name: "Twitter/X", icon: "🐦", status: "beta" }
  ];

  return (
    <section className="py-20 px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 rounded-full mb-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                🎯 Revolutionary Core Feature
              </span>
            </div>
            <h2 className="text-5xl font-bold mb-4" style={{ color: "var(--text)" }}>
              Campaign Orchestration Engine
            </h2>
            <p className="text-xl opacity-70 max-w-3xl mx-auto" style={{ color: "var(--text)" }}>
              One API call orchestrates 11 AI models to create complete marketing campaigns automatically.
              From strategy to deployment across all platforms.
            </p>
          </motion.div>
        </div>

        {/* The Power: 11 AI Models */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            <span className="text-4xl mr-2">⚡</span>
            11 Specialized AI Models Working in Harmony
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {models.map((model, idx) => (
              <motion.button
                key={model.name}
                onClick={() => setActiveModel(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  activeModel === idx ? "ring-2 ring-blue-500 scale-105" : "hover:scale-102"
                }`}
                style={{
                  background: activeModel === idx ? "var(--accent-bg)" : "var(--card)",
                  borderColor: activeModel === idx ? "var(--accent)" : "var(--border)"
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="text-3xl mb-2">{model.icon}</div>
                <h4 className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>
                  {model.name}
                </h4>
                <p className="text-xs opacity-70" style={{ color: "var(--text)" }}>
                  {model.role}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Active Model Details */}
          <motion.div
            key={activeModel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border p-8"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl">{models[activeModel].icon}</div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
                  {models[activeModel].name}
                </h4>
                <p className="text-sm opacity-70 mb-2" style={{ color: "var(--text)" }}>
                  Role: {models[activeModel].role}
                </p>
                <p className="mb-4" style={{ color: "var(--text)" }}>
                  {models[activeModel].description}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    Outputs: {models[activeModel].output}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Publishing Platforms */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            <span className="text-4xl mr-2">🚀</span>
            One-Click Multi-Platform Publishing
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {platforms.map((platform, idx) => (
              <motion.div
                key={platform.name}
                className="px-6 py-4 rounded-xl border flex items-center gap-3"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className="text-3xl">{platform.icon}</span>
                <div>
                  <h4 className="font-bold" style={{ color: "var(--text)" }}>
                    {platform.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    platform.status === "live" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {platform.status.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Process */}
        <div className="rounded-2xl border p-8 mb-16" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: "var(--text)" }}>
            How It Works: Single API Call → Complete Campaign
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📥</div>
              <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>
                1. Submit Brief
              </h4>
              <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
                One API call with your campaign requirements
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>
                2. AI Orchestration
              </h4>
              <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
                11 models work in parallel: strategy, content, visuals, video
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">✨</div>
              <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>
                3. Deploy Everywhere
              </h4>
              <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
                Publish to all platforms with one click
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-lg opacity-70 mb-6" style={{ color: "var(--text)" }}>
              Experience the most advanced AI advertising platform
            </p>
            <a
              href="/dashboard"
              className="inline-block px-8 py-4 rounded-xl font-bold text-lg transition hover:opacity-90 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)",
                color: "var(--text)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}
            >
              Start Creating Campaigns →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
