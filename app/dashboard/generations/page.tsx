"use client";

import { useState, useEffect } from "react";

interface SoraJob {
  id: string;
  prompt: string;
  model: "sora-1" | "sora-1-hd";
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  videoUrl?: string;
  error?: string;
  duration?: number;
  estimatedTime?: number;
}

export default function GenerationsPage() {
  const [jobs, setJobs] = useState<SoraJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [newPrompt, setNewPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<"sora-1" | "sora-1-hd">(
    "sora-1"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/sora/jobs");
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error("Failed to load generations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sora/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newPrompt,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const job = await response.json();
        setJobs([job, ...jobs]);
        setNewPrompt("");
      }
    } catch (error) {
      console.error("Failed to submit generation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs =
    filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
        Video Generations (Sora)
      </h1>

      {/* New Generation Form */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Create New Video Generation
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2 opacity-70"
              style={{ color: "var(--text)" }}
            >
              Prompt
            </label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Describe the video you want to generate... (max 1000 chars)"
              maxLength={1000}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border resize-none focus:outline-none"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <div className="text-xs opacity-50 mt-2" style={{ color: "var(--text)" }}>
              {newPrompt.length}/1000 characters
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2 opacity-70"
                style={{ color: "var(--text)" }}
              >
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) =>
                  setSelectedModel(e.target.value as "sora-1" | "sora-1-hd")
                }
                className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                <option value="sora-1">Sora 1 (faster)</option>
                <option value="sora-1-hd">Sora 1 HD (higher quality)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={!newPrompt.trim() || isSubmitting}
                className="w-full px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                {isSubmitting ? "Submitting..." : "Generate Video →"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {["all", "queued", "processing", "completed", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status ? "opacity-100" : "opacity-50 hover:opacity-70"
            }`}
            style={{
              background: filter === status ? "var(--accent)" : "transparent",
              color: "var(--text)",
              border: `1px solid var(--border)`,
            }}
          >
            {status === "all"
              ? "All"
              : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}{" "}
            ({filteredJobs.filter((j) => j.status === status).length || 0})
          </button>
        ))}
      </div>

      {/* Jobs Queue */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <GenerationJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🎬</div>
          <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            No {filter !== "all" ? filter : ""} generations
          </div>
          <p className="text-sm opacity-50 mt-2" style={{ color: "var(--text)" }}>
            Create your first video generation above to get started
          </p>
        </div>
      )}
    </div>
  );
}

function GenerationJobCard({ job }: { job: SoraJob }) {
  const statusConfig = {
    queued: { icon: "⏳", color: "#f59e0b", label: "Queued" },
    processing: { icon: "⚙️", color: "#3b82f6", label: "Processing" },
    completed: { icon: "✅", color: "#10b981", label: "Completed" },
    failed: { icon: "❌", color: "#ef4444", label: "Failed" },
  };

  const config = statusConfig[job.status];
  const duration = job.completedAt
    ? Math.round((job.completedAt - job.createdAt) / 1000)
    : job.estimatedTime
      ? job.estimatedTime
      : "—";

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className="text-3xl">{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold line-clamp-2" style={{ color: "var(--text)" }}>
                {job.prompt}
              </h3>
              <p className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
                {job.model} · {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2"
              style={{
                background: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Progress Bar */}
          {job.status === "processing" && (
            <div className="mt-3 w-full bg-black/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  width: "60%",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Video Result */}
          {job.status === "completed" && job.videoUrl && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs opacity-70 mb-2" style={{ color: "var(--text)" }}>
                Video ready:
              </p>
              <a
                href={job.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  background: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                View Video →
              </a>
            </div>
          )}

          {/* Error Message */}
          {job.status === "failed" && job.error && (
            <div
              className="mt-3 pt-3 border-t text-xs"
              style={{ borderColor: "var(--border)", color: "#ef4444" }}
            >
              Error: {job.error}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="text-right">
          <div className="text-sm font-mono opacity-70" style={{ color: "var(--text)" }}>
            {typeof duration === "number" ? `${duration}s` : duration}
          </div>
          <p className="text-xs opacity-50 mt-1" style={{ color: "var(--text)" }}>
            {job.status === "processing"
              ? "Est. time"
              : job.status === "completed"
                ? "Duration"
                : "Elapsed"}
          </p>
        </div>
      </div>
    </div>
  );
}
