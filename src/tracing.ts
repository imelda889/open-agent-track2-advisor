// JSONL trace logger: every agent handoff is appended to logs/ and stdout.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(here, "..", "logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

export interface TraceEvent {
  timestamp: string;
  trace_id: string;
  agent_name: string;
  action: string;
  input_summary: string;
  output_summary: string;
  target_agent?: string;
  confidence?: number;
  retry_count?: number;
  status: "success" | "error" | "revision_requested";
}

export function logPath(traceId: string): string {
  return path.join(LOG_DIR, `${traceId}.jsonl`);
}

export function trace(traceId: string, e: Omit<TraceEvent, "timestamp" | "trace_id">): void {
  const full: TraceEvent = { timestamp: new Date().toISOString(), trace_id: traceId, ...e };
  const line = JSON.stringify(full);
  fs.appendFileSync(logPath(traceId), line + "\n");
  console.log(line);
}
