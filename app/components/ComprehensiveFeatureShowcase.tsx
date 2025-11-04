"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Zap, 
  Bot, 
  Palette, 
  Video, 
  Globe, 
  Brain, 
  Wand2,
  Code,
  Layers,
  Hexagon,
  BookOpen,
  Workflow
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "orchestration" | "ai-models" | "platforms" | "tools";
  status: "live" | "beta" | "coming-soon";
  highlight?: boolean;
}

const features: Feature[] = [
  // 🎯 Campaign Orchestration Engine
  {
    id: "campaign-orchestration",
    title: "Campaign Orchestration Engine",
    description: "Revolutionary unified platform - one API call orchestrates 11 AI models to create complete marketing campaigns automatically.",
    icon: <Workflow className="w-6 h-6" />,
    category: "orchestration",
    status: "live",
    highlight: true
  },

  // 🤖 AI Models
  {
    id: "kimi-linear",
    title: "Kimi-Linear Strategy",
    description: "Advanced strategic planning and market analysis with linear thought processing for comprehensive campaign foundations.",
    icon: <Brain className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },
  {
    id: "hunyuan-3d",
    title: "Hunyuan 3D Assets",
    description: "Revolutionary 3D content generation for immersive advertising experiences and product visualizations.",
    icon: <Layers className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },
  {
    id: "worldgrow",
    title: "WorldGrow Global",
    description: "Global market expansion strategies with cultural adaptation and international campaign optimization.",
    icon: <Globe className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },
  {
    id: "longcat-video",
    title: "LongCat Video",
    description: "Advanced video content generation with narrative continuity and engagement optimization.",
    icon: <Video className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },
  {
    id: "ditto",
    title: "Ditto Brand Voice",
    description: "Consistent brand voice across all channels with personality adaptation and tone optimization.",
    icon: <Wand2 className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },
  {
    id: "nitro-e",
    title: "Nitro-E Performance",
    description: "High-performance ad copy generation optimized for conversion rates and engagement metrics.",
    icon: <Zap className="w-6 h-6" />,
    category: "ai-models",
    status: "live"
  },

  // 🍯 Platform Ecosystem
  {
    id: "beehive-swarm",
    title: "BeeHive Swarm Intelligence",
    description: "Distributed AI agents working together like a hive mind for collaborative campaign creation and optimization.",
    icon: <Hexagon className="w-6 h-6" />,
    category: "platforms",
    status: "live",
    highlight: true
  },
  {
    id: "gemini-cookbook",
    title: "Gemini Cookbook Lab",
    description: "Advanced AI experimentation platform with Google Gemini integration for cutting-edge content generation.",
    icon: <BookOpen className="w-6 h-6" />,
    category: "platforms",
    status: "live"
  },
  {
    id: "fusion-orchestra",
    title: "AdGenXAI Fusion",
    description: "Multi-model orchestration system that combines different AI capabilities into unified campaign workflows.",
    icon: <Bot className="w-6 h-6" />,
    category: "platforms",
    status: "live"
  },

  // 🛠️ Developer Tools
  {
    id: "api-orchestration",
    title: "Unified API Layer",
    description: "Single API endpoint that intelligently routes to optimal AI models based on campaign requirements.",
    icon: <Code className="w-6 h-6" />,
    category: "tools",
    status: "live"
  },
  {
    id: "cost-optimization",
    title: "Cost Intelligence",
    description: "AI-powered cost optimization delivering 80-90% savings through intelligent model routing and batch processing.",
    icon: <Sparkles className="w-6 h-6" />,
    category: "tools",
    status: "live"
  },
  {
    id: "creative-suite",
    title: "Creative AI Suite",
    description: "Comprehensive creative tools powered by Dall-E-3, Claude-3.5-Sonnet, GPT-4-Turbo, and Stable Diffusion.",
    icon: <Palette className="w-6 h-6" />,
    category: "tools",
    status: "live"
  }
];

const categoryColors = {
  orchestration: "from-purple-500 to-pink-500",
  "ai-models": "from-blue-500 to-cyan-500", 
  platforms: "from-green-500 to-emerald-500",
  tools: "from-orange-500 to-red-500"
};

const categoryLabels = {
  orchestration: "🎯 Core Engine",
  "ai-models": "🤖 AI Models",
  platforms: "🍯 Platform Ecosystem", 
  tools: "🛠️ Developer Tools"
};

export default function ComprehensiveFeatureShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const filteredFeatures = selectedCategory === "all" 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const categories = ["all", "orchestration", "ai-models", "platforms", "tools"];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
            Complete AI Advertising Ecosystem
          </h2>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto">
            The world's most advanced AI advertising platform - featuring unified orchestration, 
            11 specialized AI models, and revolutionary automation that creates complete campaigns from a single request.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {category === "all" ? "🌟 All Features" : categoryLabels[category as keyof typeof categoryLabels]}
            </button>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(feature.id)}
                onHoverEnd={() => setHoveredFeature(null)}
                className={`relative group p-8 rounded-2xl border transition-all duration-300 ${
                  feature.highlight
                    ? "bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/50 shadow-lg shadow-purple-500/25"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                } ${hoveredFeature === feature.id ? "scale-105 shadow-2xl" : ""}`}
              >
                {/* Highlight Badge */}
                {feature.highlight && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ NEW
                  </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full ${
                  feature.status === "live" ? "bg-green-500/20 text-green-300" :
                  feature.status === "beta" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-blue-500/20 text-blue-300"
                }`}>
                  {feature.status === "live" ? "🟢 LIVE" : 
                   feature.status === "beta" ? "🟡 BETA" : "🔵 SOON"}
                </div>

                {/* Icon */}
                <motion.div
                  animate={hoveredFeature === feature.id ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${categoryColors[feature.category]} p-4 mb-6 shadow-lg`}
                >
                  <div className="text-white w-full h-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Category Label */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-sm text-slate-400">
                    {categoryLabels[feature.category]}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-12 border border-purple-500/30">
            <h3 className="text-3xl font-bold text-white mb-6">
              Ready to Experience the Future of AI Advertising?
            </h3>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using AdGenXAI's revolutionary platform to create 
              complete marketing campaigns in seconds, not weeks.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              🚀 Start Creating Campaigns Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}