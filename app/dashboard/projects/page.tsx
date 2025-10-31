"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  model: string;
  prompt: string;
  output: string;
  tokensUsed: number;
  latency: number;
  createdAt: number;
  tags: string[];
  status: "success" | "failed" | "pending";
  thumbnail?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/dashboard/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  const models = Array.from(new Set(projects.map((p) => p.model)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg opacity-50">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          Projects Gallery
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "opacity-100"
                : "opacity-50 hover:opacity-70"
            }`}
            style={{
              background: filter === "all" ? "var(--accent)" : "transparent",
              color: "var(--text)",
              border: `1px solid var(--border)`,
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "success"
                ? "opacity-100"
                : "opacity-50 hover:opacity-70"
            }`}
            style={{
              background: filter === "success" ? "var(--accent)" : "transparent",
              color: "var(--text)",
              border: `1px solid var(--border)`,
            }}
          >
            ✅ Successful
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "failed"
                ? "opacity-100"
                : "opacity-50 hover:opacity-70"
            }`}
            style={{
              background: filter === "failed" ? "var(--accent)" : "transparent",
              color: "var(--text)",
              border: `1px solid var(--border)`,
            }}
          >
            ❌ Failed
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">📭</div>
          <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            No projects found
          </div>
          <p className="text-sm opacity-50 mt-2" style={{ color: "var(--text)" }}>
            Create your first generation to get started
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg font-medium transition"
            style={{
              background: "var(--accent)",
              color: "var(--text)",
            }}
          >
            Create Now →
          </a>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden hover:border-blue-500/50 transition cursor-pointer"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Thumbnail */}
      <div
        className="h-40 w-full flex items-center justify-center text-4xl"
        style={{ background: "var(--bg)" }}
      >
        {project.status === "success" ? "✨" : project.status === "failed" ? "❌" : "⏳"}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>
            {project.title}
          </h3>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              project.status === "success"
                ? "bg-green-500/20 text-green-400"
                : project.status === "failed"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {project.status}
          </span>
        </div>

        <p className="text-xs opacity-50 mb-3" style={{ color: "var(--text)" }}>
          {project.model} · {new Date(project.createdAt).toLocaleDateString()}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full opacity-70"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="text-xs px-2 py-1 opacity-50" style={{ color: "var(--text)" }}>
                +{project.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>{project.tokensUsed.toLocaleString()} tokens</span>
          <span>{project.latency}ms latency</span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold opacity-70" style={{ color: "var(--text)" }}>
                  Prompt:
                </label>
                <p className="text-xs opacity-50 mt-1 line-clamp-2" style={{ color: "var(--text)" }}>
                  {project.prompt}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold opacity-70" style={{ color: "var(--text)" }}>
                  Output:
                </label>
                <p className="text-xs opacity-50 mt-1 line-clamp-3" style={{ color: "var(--text)" }}>
                  {project.output}
                </p>
              </div>
              <button
                className="w-full px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  background: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                View Full Details →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
