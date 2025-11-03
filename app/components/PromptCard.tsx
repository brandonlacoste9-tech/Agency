"use client";
import { useCallback, useRef, useState } from "react";
import { useStreamingMetrics } from "../../lib/hooks/useStreamingMetrics";

export default function PromptCard() {
  const [model, setModel] = useState("openai/gpt-5");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);
  const { recordMetric } = useStreamingMetrics();
  const startTimeRef = useRef<number>(0);
  const firstTokenTimeRef = useRef<number>(0);

  const resetAbort = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    return abortRef.current;
  };

  const ask = useCallback(async () => {
    // If the environment can't stream, fall back to the old non-streaming path.
    const supportsStream = typeof ReadableStream !== "undefined";
    setAnswer("");
    setLoading(true);
    setStreaming(false);
    startTimeRef.current = Date.now();
    firstTokenTimeRef.current = 0;
    let wasAborted = false;
    let tokenCount = 0;

    try {
      if (!supportsStream) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAnswer(data.answer ?? "");

        // Record non-streaming metric
        recordMetric({
          type: 'generation',
          duration: Date.now() - startTimeRef.current,
          success: true,
          metadata: {
            model,
            latency: Date.now() - startTimeRef.current,
            tokensGenerated: (data.answer ?? "").split(/\s+/).length,
            wasAborted: false,
            status: "success",
          }
        });
        return;
      }

      // Streaming path
      const controller = resetAbort();
      setStreaming(true);
      const res = await fetch(`/api/chat?stream=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Stream HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done ?? false;
        if (done) break;
        const text = decoder.decode(chunk.value, { stream: true });
        // Expect SSE-ish framing: lines beginning with "data: "
        // We accept raw token text as well. Split on double newlines too.
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data:")) {
            // Extract token preserving spaces (only remove "data: " prefix)
            const token = trimmed.startsWith("data: ")
              ? trimmed.slice(6)  // Remove "data: " (colon + space)
              : trimmed.slice(5);  // Remove just "data"
            if (token === "[DONE]") {
              done = true;
              break;
            }
            // Record first token latency
            if (firstTokenTimeRef.current === 0) {
              firstTokenTimeRef.current = Date.now();
            }
            tokenCount++;
            setAnswer((prev) => prev + token);
          } else {
            // Raw token fallback (no SSE prefix)
            if (firstTokenTimeRef.current === 0) {
              firstTokenTimeRef.current = Date.now();
            }
            tokenCount++;
            setAnswer((prev) => prev + trimmed);
          }
        }
      }

      // Record streaming metric
      recordMetric({
        type: 'generation',
        duration: Date.now() - startTimeRef.current,
        success: true,
        metadata: {
          model,
          latency: firstTokenTimeRef.current - startTimeRef.current,
          totalDuration: Date.now() - startTimeRef.current,
          tokensGenerated: tokenCount,
          wasAborted: false,
          status: "success",
        }
      });
    } catch (err) {
      // If user aborted, surface a calm message
      const isAborted = (err as any)?.name === "AbortError";
      if (isAborted) {
        wasAborted = true;
        setAnswer((prev) => prev || "Stream aborted");
      } else {
        setAnswer(`Error: ${(err as Error).message}`);
      }

      // Record error metric
      recordMetric({
        type: 'generation',
        duration: Date.now() - startTimeRef.current,
        success: false,
        metadata: {
          model,
          latency: firstTokenTimeRef.current - startTimeRef.current,
          totalDuration: Date.now() - startTimeRef.current,
          tokensGenerated: tokenCount,
          wasAborted,
          status: isAborted ? "aborted" : "error",
        }
      });
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  }, [model, prompt, recordMetric]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
    >
      <div className="flex items-center gap-2">
        <label className="text-sm opacity-70">Model</label>
        <select
          className="rounded-lg border px-2 py-1 text-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="openai/gpt-5">openai/gpt-5</option>
          <option value="openai/gpt-4o">openai/gpt-4o</option>
        </select>
      </div>

      <textarea
        className="mt-3 w-full rounded-xl border p-3"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your idea"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={ask}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-semibold shadow border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          {loading ? (streaming ? "Streaming…" : "Thinking…") : "Generate"}
        </button>
        <button
          type="button"
          data-testid="abort-stream"
          onClick={abort}
          disabled={!streaming}
          className="rounded-xl px-3 py-2 text-sm border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)", opacity: streaming ? 1 : 0.6 }}
          aria-disabled={!streaming}
          aria-label="Abort streaming response"
        >
          Abort
        </button>
      </div>

      <div
        data-testid="answer-stream"
        aria-live="polite"
        className="mt-4 whitespace-pre-wrap rounded-xl border p-3 text-sm min-h-[2.5rem]"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        {answer}
      </div>
    </section>
  );
}
