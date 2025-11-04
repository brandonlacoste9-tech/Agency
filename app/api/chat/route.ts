import { NextRequest } from "next/server";

type Body = { model?: string; prompt?: string };

export const runtime = "nodejs"; // ensure Node runtime for streaming
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wantStream = searchParams.get("stream") === "1";

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const model = body.model ?? "openai/gpt-5";
  const prompt = (body.prompt ?? "").trim();

  if (!prompt) {
    return Response.json({ error: "Missing 'prompt'" }, { status: 400 });
  }

  // Non-streaming path (JSON)
  if (!wantStream) {
    // Call your provider here. For now, return a simple echo.
    const answer = `You asked: ${prompt}`;
    return Response.json({ model, answer });
  }

  // Streaming path (SSE)
  const headers = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      // --- Option A: Relay an upstream stream (provider that supports SSE)
      // If you have a real upstream, uncomment and adapt this block:
      // try {
      //   const upstream = await fetch("https://models.github.ai/inference/chat/completions?stream=1", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}`,
      //     },
      //     body: JSON.stringify({
      //       model,
      //       messages: [
      //         { role: "system", content: "You are a helpful assistant." },
      //         { role: "user", content: prompt },
      //       ],
      //       stream: true,
      //     }),
      //   });
      //   if (!upstream.ok || !upstream.body) throw new Error(`Upstream ${upstream.status}`);
      //   const reader = upstream.body.getReader();
      //   while (true) {
      //     const { value, done } = await reader.read();
      //     if (done) break;
      //     controller.enqueue(value); // relay raw SSE bytes
      //   }
      //   controller.enqueue(enc.encode("data: [DONE]\n\n"));
      //   controller.close();
      //   return;
      // } catch (err) {
      //   // fall through to synthetic stream
      // }

      // --- Option B: Synthetic stream (fallback)
      const synthetic =
        `Here's a friendly answer from ${model}: ` +
        `AdGenXAI is online and streaming happily.`;

      // Split by token-ish chunks to simulate streaming
      const pieces = synthetic.match(/.{1,8}/g) ?? [synthetic];
      for (const p of pieces) {
        controller.enqueue(enc.encode(`data: ${p}\n\n`));
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.enqueue(enc.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, { headers });
}
