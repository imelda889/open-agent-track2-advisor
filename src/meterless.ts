// Meterless integration point: H-MEM is the Meterless engine in use.
// This module keeps all Meterless calls behind one interface so the
// agent code never touches the vendor path directly.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadHMEM } from "./engine.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

export interface MemoryHandle {
  query: (q: string, opts?: { threshold?: number }) => any;
  mine: (kind: string, text: string) => Promise<any[]>;
  add: (rec: { content: string; type: string; source: string }) => any;
  ledger: { history: (id: string) => any[] };
}

export async function getMemory(): Promise<{ hmem: MemoryHandle; source: string }> {
  const { HMEM, source } = await loadHMEM();
  const hmem = new HMEM({ persistDir: path.join(here, "..", ".notebook") });
  return { hmem: hmem as MemoryHandle, source };
}

export function engineName(): string {
  return "H-MEM (Meterless hierarchical memory: mining, retrieval, trust ledger, sleep)";
}
