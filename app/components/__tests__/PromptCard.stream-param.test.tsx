import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import PromptCard from "@/components/PromptCard";

describe("PromptCard: stream=1 query parameter", () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async (url: any) => {
      // If stream=1 is in URL, return SSE stream
      if (typeof url === "string" && url.includes("/api/chat?stream=1")) {
        return new Response(
          new ReadableStream({
            start(c) {
              const enc = new TextEncoder();
              c.enqueue(enc.encode("data: Hello\n\n"));
              c.enqueue(enc.encode("data:  world\n\n"));
              c.enqueue(enc.encode("data: [DONE]\n\n"));
              c.close();
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } }
        ) as any;
      }
      // Otherwise, return non-streaming JSON
      return new Response(JSON.stringify({ answer: "fallback" }), {
        headers: { "Content-Type": "application/json" },
      }) as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = origFetch as any;
  });

  it("hits /api/chat?stream=1 when streaming is supported", async () => {
    const user = userEvent.setup();
    render(<PromptCard />);

    const textarea = screen.getByPlaceholderText(/type your idea/i);
    await user.type(textarea, "Test prompt");

    const generateBtn = screen.getByRole("button", { name: /generate/i });
    await user.click(generateBtn);

    // Wait for streaming to render tokens
    await waitFor(() => {
      expect(screen.getByTestId("answer-stream").textContent).toContain("Hello");
    });

    // Verify the correct endpoint was called
    const calls = (global.fetch as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    // Check that at least one call used the stream=1 endpoint
    const streamCalls = calls.filter((c: any[]) => {
      const url = c[0];
      return typeof url === "string" && url.includes("/api/chat?stream=1");
    });
    expect(streamCalls.length).toBeGreaterThan(0);
  });

  it("includes POST method with Content-Type header", async () => {
    const user = userEvent.setup();
    render(<PromptCard />);

    const textarea = screen.getByPlaceholderText(/type your idea/i);
    await user.type(textarea, "Test");

    const generateBtn = screen.getByRole("button", { name: /generate/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0);
    });

    // Check the most recent fetch call
    const calls = (global.fetch as any).mock.calls;
    const streamCall = calls.find((c: any[]) => {
      const url = c[0];
      return typeof url === "string" && url.includes("/api/chat?stream=1");
    });

    expect(streamCall).toBeDefined();
    const [, options] = streamCall;
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBeDefined();
  });
});
