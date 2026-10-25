// Programmatic entry point: POST /run. Lets judges run the agent without a UI.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { runTrack2 } from "./src/agents.ts";
import { getMemory } from "./src/meterless.ts";

const PORT = Number(process.env.PORT ?? 8000);

function send(res: http.ServerResponse, code: number, obj: unknown): void {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(obj, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    send(res, 200, { ok: true });
    return;
  }
  if (req.method === "POST" && (req.url === "/feedback" || req.url?.startsWith("/feedback?"))) {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const helpful = parsed.helpful === true;
        const q = String(parsed.user_query ?? "").slice(0, 500);
        const { hmem } = await getMemory();
        const text = `User rated an answer ${helpful ? "helpful" : "not helpful"} for question: ${q}`;
        const mined = await hmem.mine("user_feedback", text);
        if (mined.length === 0) {
          hmem.add({ content: text, type: "feedback", source: "chat:feedback" });
        }
        send(res, 200, { ok: true, recorded: helpful ? "helpful" : "not_helpful" });
      } catch (err) {
        send(res, 500, { type: "error", code: "feedback_failed", message: (err as Error).message.slice(0, 300) });
      }
    });
    return;
  }
  if (req.method === "POST" && (req.url === "/run" || req.url?.startsWith("/run?"))) {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const requestId = String(parsed.request_id ?? `req-${randomUUID().slice(0, 8)}`);
        const userQuery = String(parsed.user_query ?? "");
        if (!userQuery.trim()) {
          send(res, 400, { type: "error", code: "bad_request", message: "user_query is required" });
          return;
        }
        const started = Date.now();
        try {
          const r = await runTrack2(userQuery, requestId);
          send(res, 200, {
            request_id: requestId,
            trace_id: r.trace_id,
            status: "success",
            agents_used: r.agents_used,
            result: r.result,
            collaboration: r.collaboration,
            ai_provider: r.ai_provider,
            zetaris_live: r.zetaris_live,
            memory_engine: `Meterless H-MEM (${r.memory_source})`,
            log_path: `logs/${r.trace_id}.jsonl`,
            elapsed_ms: Date.now() - started,
          });
        } catch (err) {
          send(res, 500, {
            request_id: requestId, status: "error",
            type: "error", code: "agent_failed",
            message: (err as Error).message.slice(0, 500),
          });
        }
      } catch (err) {
        send(res, 400, { type: "error", code: "bad_json", message: (err as Error).message });
      }
    });
    return;
  }
  send(res, 404, { type: "error", code: "not_found", message: "Use POST /run or GET /health" });
});

server.listen(PORT, () => console.log(`Track2 agent on http://localhost:${PORT} (POST /run)`));
