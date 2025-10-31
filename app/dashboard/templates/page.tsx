"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  uses: number;
  rating: number;
  tags: string[];
  author: string;
  createdAt: number;
}

const CATEGORIES = [
  "Commercial",
  "Narrative",
  "Comedy",
  "Educational",
  "Product",
  "Storytelling",
];

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: "1",
    title: "Product Showcase",
    description: "Create an engaging product demonstration video",
    category: "Commercial",
    prompt:
      "Create a sleek product showcase video featuring a {product} on a minimalist white background. Show the product rotating slowly with soft lighting. Add subtle animations that highlight key features. Duration: 15 seconds.",
    difficulty: "easy",
    uses: 245,
    rating: 4.8,
    tags: ["product", "commercial", "showcase"],
    author: "Template Library",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    title: "Brand Story",
    description: "Tell your brand's origin and mission story",
    category: "Narrative",
    prompt:
      "Create a compelling brand story video that shows {brand_name}'s journey from idea to market leader. Include journey milestones, team collaboration moments, and customer success stories. Tone: inspirational and authentic.",
    difficulty: "medium",
    uses: 189,
    rating: 4.6,
    tags: ["brand", "narrative", "story"],
    author: "Template Library",
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    title: "Tutorial Series",
    description: "Educational step-by-step guide format",
    category: "Educational",
    prompt:
      "Create an educational tutorial video explaining how to {topic}. Break down the process into clear steps. Use clear visuals, on-screen text, and a friendly voiceover-style narration. Include tips and common mistakes to avoid.",
    difficulty: "medium",
    uses: 156,
    rating: 4.7,
    tags: ["tutorial", "education", "howto"],
    author: "Template Library",
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: "4",
    title: "Social Media Teaser",
    description: "Short, engaging teaser for social platforms",
    category: "Commercial",
    prompt:
      "Create a 6-second teaser video for {platform} that hooks viewers immediately. Use quick cuts, trending audio, and bold text overlays. End with a call-to-action that drives curiosity. Style: modern, energetic, trendy.",
    difficulty: "easy",
    uses: 312,
    rating: 4.9,
    tags: ["social", "teaser", "viral"],
    author: "Template Library",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: "5",
    title: "Customer Testimonial",
    description: "Authentic customer success story format",
    category: "Commercial",
    prompt:
      "Create a customer testimonial video featuring {customer_name} sharing their success story with {product}. Show before/after results, their daily use case, and emotional impact. Keep it authentic and relatable. Duration: 30 seconds.",
    difficulty: "medium",
    uses: 203,
    rating: 4.6,
    tags: ["testimonial", "customer", "success"],
    author: "Template Library",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(SAMPLE_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In production, fetch from /api/dashboard/templates
    // For now, using sample data
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Prompt Templates
        </h1>
        <p className="opacity-70" style={{ color: "var(--text)" }}>
          Browse curated templates to jumpstart your creative process
        </p>
      </div>

      {/* Search Bar */}
      <div
        className="rounded-xl border p-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <input
          type="text"
          placeholder="Search templates by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-opacity-50 focus:outline-none"
          style={{
            background: "var(--bg)",
            color: "var(--text)",
            border: `1px solid var(--border)`,
          }}
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedCategory === category
                ? "opacity-100"
                : "opacity-50 hover:opacity-70"
            }`}
            style={{
              background:
                selectedCategory === category ? "var(--accent)" : "transparent",
              color: "var(--text)",
              border: `1px solid var(--border)`,
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            No templates found
          </div>
          <p className="text-sm opacity-50 mt-2" style={{ color: "var(--text)" }}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden hover:border-blue-500/50 transition"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>
              {template.title}
            </h3>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                background:
                  template.difficulty === "easy"
                    ? "rgb(16, 185, 129, 0.2)"
                    : template.difficulty === "medium"
                      ? "rgb(245, 158, 11, 0.2)"
                      : "rgb(239, 68, 68, 0.2)",
                color:
                  template.difficulty === "easy"
                    ? "#10b981"
                    : template.difficulty === "medium"
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {template.difficulty}
            </span>
          </div>
          <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
            {template.description}
          </p>
        </div>

        {/* Category and Rating */}
        <div className="flex items-center justify-between text-xs">
          <span
            className="px-2 py-1 rounded-lg opacity-70"
            style={{ background: "var(--bg)", color: "var(--text)" }}
          >
            {template.category}
          </span>
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span style={{ color: "var(--text)" }}>{template.rating}</span>
            <span className="opacity-50" style={{ color: "var(--text)" }}>
              ({template.uses} uses)
            </span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full opacity-50"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Prompt Preview */}
        <div
          className="p-3 rounded-lg text-xs opacity-70 line-clamp-3"
          style={{ background: "var(--bg)", color: "var(--text)" }}
        >
          {template.prompt}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition"
            style={{
              background: "var(--accent)",
              color: "var(--text)",
              opacity: copied ? 0.7 : 1,
            }}
          >
            {copied ? "✅ Copied" : "📋 Copy Prompt"}
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border"
            style={{
              background: "transparent",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          >
            Use Template →
          </button>
        </div>
      </div>
    </div>
  );
}
