import { appConfig } from "@/config/app.config";

/**
 * POST chat messages to Express G3Q AI (Gemini + Abhiyan system prompt).
 * Streams SSE: chunk → done | error.
 */
function chatBaseUrl() {
  const configured = (appConfig.api.baseUrl || "/api").replace(/\/$/, "");
  if (configured.startsWith("http")) return configured;
  return configured;
}

/**
 * @param {Array<{ role: 'user'|'assistant', content: string }>} messages
 * @param {{ onChunk?: (text: string) => void, signal?: AbortSignal }} [opts]
 * @returns {Promise<{ reply: string, model?: string, latencyMs?: number }>}
 */
export async function streamG3qAiChat(messages, { onChunk, signal } = {}) {
  const res = await fetch(`${chatBaseUrl()}/g3q-ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || "G3Q AI request failed.");
  }

  if (!res.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let model;
  let latencyMs;

  const handleEvent = (raw) => {
    const line = raw.trim();
    if (!line.startsWith("data:")) return;
    const json = line.slice(5).trim();
    if (!json || json === "[DONE]") return;

    let event;
    try {
      event = JSON.parse(json);
    } catch {
      return;
    }

    if (event.type === "chunk" && event.text) {
      reply += event.text;
      onChunk?.(event.text);
      return;
    }

    if (event.type === "done") {
      model = event.model;
      latencyMs = event.latencyMs;
      return;
    }

    if (event.type === "error") {
      throw new Error(event.message || "G3Q AI stream error.");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      handleEvent(raw);
    }
  }

  if (buffer.trim()) handleEvent(buffer);

  if (!reply.trim()) {
    throw new Error("Empty reply from G3Q AI.");
  }

  return { reply, model, latencyMs };
}

/** @deprecated Prefer streamG3qAiChat — kept as alias. */
export const sendG3qAiChat = streamG3qAiChat;
