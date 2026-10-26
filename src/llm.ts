// Answer path. Primary AI provider: Meterless Nightshift (OpenAI-compatible,
// default http://127.0.0.1:8088/v1, model meterless/auto). Per hackathon rules
// the app must use Nightshift as its primary AI provider with NVIDIA models
// connected through it. Graceful fallback: retrieval-only when Nightshift
// is unreachable (labeled in output + traces, never faked).

export interface AnswerResult {
  mode: "nightshift" | "retrieval-only" | "model";
  model?: string;
  text: string;
}

const NIGHTSHIFT_BASE = (process.env.METERLESS_BASE_URL ?? "http://127.0.0.1:8088/v1").replace(/\/$/, "");
const NIGHTSHIFT_MODEL = process.env.METERLESS_MODEL ?? "meterless/auto";

async function nightshiftAnswer(question: string, memoryContext: string, evidence: string): Promise<AnswerResult> {
  const token = process.env.METERLESS_RUNTIME_TOKEN ?? "rt-local";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "meterless-app": "track2-advisor",
    "meterless-scope": "user",
  };
  if (token !== "rt-local") headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${NIGHTSHIFT_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: NIGHTSHIFT_MODEL,
      messages: [
        {
          role: "user",
          content: `You are a tech stack advisor. Start DIRECTLY with the answer - no preamble, no meta-commentary about what you are doing, no <think> blocks. Answer ONLY from the evidence below, citing the source table for each claim. Do NOT repeat full raw tables; summarize values and cite the table name. If evidence is thin, add a short "Evidence gaps" list at the end.\n\nEVIDENCE:\n${evidence}\n\nMEMORY:\n${memoryContext}\n\nQuestion: ${question}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("nightshift-unauthorized: paste the runtime token as METERLESS_RUNTIME_TOKEN");
  }
  if (!res.ok) throw new Error(`nightshift HTTP ${res.status}`);
  const data = (await res.json()) as any;
  const text: string =
    typeof data.choices?.[0]?.message?.content === "string"
      ? data.choices[0].message.content
      : JSON.stringify(data).slice(0, 2000);
  // Model that actually handled it: prefer server-reported model, else requested.
  const model: string = data.model ?? NIGHTSHIFT_MODEL;
  return { mode: "nightshift", model, text };
}

export async function answer(
  question: string,
  memoryContext: string,
  memories: { relevance: number; content: string }[],
  evidence = ""
): Promise<AnswerResult> {
  // 1. Nightshift first (primary provider per rules).
  if (process.env.METERLESS_DISABLED !== "true") {
    try {
      return await nightshiftAnswer(question, memoryContext, evidence);
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.startsWith("nightshift-unauthorized")) {
        return { mode: "retrieval-only", text: retrievalOnly(question, memories) + `\n\n(Nightshift unreachable at ${NIGHTSHIFT_BASE}; install Nightshift + set METERLESS_RUNTIME_TOKEN. Retrieval-only fallback.)` };
      }
      return { mode: "retrieval-only", text: retrievalOnly(question, memories) + `\n\n(${msg})` };
    }
  }
  // 2. Legacy Anthropic path (optional).
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        messages: [{ role: "user", content: `${memoryContext}\n\nQuestion: ${question}` }],
      });
      const text = response.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      return { mode: "model", model: "claude-sonnet-5", text };
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("Cannot find") || msg.includes("Cannot resolve")) {
        return { mode: "retrieval-only", text: retrievalOnly(question, memories) + "\n\n(ANTHROPIC_API_KEY is set but @anthropic-ai/sdk is not installed; run: npm install @anthropic-ai/sdk)" };
      }
      throw err;
    }
  }
  return { mode: "retrieval-only", text: retrievalOnly(question, memories) };
}

function retrievalOnly(question: string, memories: { relevance: number; content: string }[]): string {
  if (memories.length === 0) {
    return `Nothing in memory answers "${question}" yet. Teach me: notebook remember "<fact>"`;
  }
  const lines = [`Based on what I remember about "${question}":`];
  for (const m of memories) lines.push(`- ${m.content} (relevance ${m.relevance.toFixed(2)})`);
  return lines.join("\n");
}
