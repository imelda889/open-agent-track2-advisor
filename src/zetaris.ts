// Zetaris adapter: UI proxy route (proven by getting-started/scripts/zetaris_api.py).
// POST {BASE}/api/proxy/sql-editor/sqls/run-query with Bearer + X-Org-ID + X-Request-ID.
// SAMPLE_MODE=true or missing creds -> sample records only (never prewritten answers).
import { randomUUID } from "node:crypto";

export interface ZetarisRow {
  [k: string]: unknown;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

async function loginToken(base: string): Promise<string> {
  const username = env("ZETARIS_USERNAME");
  const password = env("ZETARIS_PASSWORD");
  if (!username || !password) throw new Error("Set ZETARIS_API_KEY or ZETARIS_USERNAME/ZETARIS_PASSWORD.");
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-ID": randomUUID() },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Zetaris login failed: HTTP ${res.status}`);
  const login = (await res.json()) as Record<string, unknown>;
  const tok =
    (login.idToken as string) || (login.token as string) || (login.accessToken as string);
  if (tok && typeof tok === "string") return tok;
  const m = JSON.stringify(login).match(/[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/);
  if (m) return m[0];
  throw new Error("Zetaris login did not return an access token.");
}

function sampleRecords(sql: string): ZetarisRow[] {
  // Minimal offline samples from known instance DBs (NY_TAXI, TPCDS_DB).
  // Used only when SAMPLE_MODE=true or no credentials; real path uses live Zetaris.
  if (/tpc/i.test(sql) || /store_sales|item|date_dim/i.test(sql)) {
    return [
      { source: "TPCDS_DB", table: "store_sales", note: "sample row, live query unavailable", sales: 120 },
      { source: "TPCDS_DB", table: "item", note: "sample row, live query unavailable", item: "sample-item" },
    ];
  }
  return [
    { source: "NY_TAXI", table: "trips", note: "sample row, live query unavailable", trips: 42 },
    { source: "NY_TAXI", table: "customers", note: "sample row, live query unavailable", customers: 17 },
  ];
}

export function sampleFallback(sql: string): ZetarisRow[] {
  return sampleRecords(sql);
}

export async function runSql(sql: string, limit = 50): Promise<{ rows: unknown[]; live: boolean; columns: string[] }> {
  const clean = sql.trim().replace(/;$/, "");
  if (!clean) throw new Error("SQL must not be empty.");
  const sample = (rows: ZetarisRow[]): { rows: unknown[]; live: boolean; columns: string[] } => ({
    rows, live: false, columns: Object.keys(rows[0] ?? {}),
  });
  if (env("SAMPLE_MODE") === "true") return sample(sampleRecords(clean));

  const base = (env("ZETARIS_BASE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  const orgId = env("ZETARIS_ORG_ID");
  if (!orgId || !/^[0-9]+$/.test(orgId)) {
    // No org configured -> explicit sample fallback instead of fake live call.
    return sample(sampleRecords(clean));
  }
  let token = env("ZETARIS_API_KEY");
  if (!token) token = await loginToken(base);
  const body: Record<string, unknown> = { sql: clean, limit };
  const engineId = env("ZETARIS_ENGINE_ID");
  if (engineId) body.engineId = engineId;

  const res = await fetch(`${base}/api/proxy/sql-editor/sqls/run-query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Org-ID": orgId,
      "X-Request-ID": randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Zetaris query failed: HTTP ${res.status} ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as unknown;
  // Proxy returns {headers, data}; rows are usually arrays but some
  // tables come back as space-joined strings -- split those to match
  // the header count, otherwise keep the raw value (never invent data).
  const norm = (rows: unknown[], columns: string[]): unknown[] =>
    rows.map((r) => {
      if (typeof r !== "string") return r;
      const parts = r.split(/\s+/);
      return parts.length === columns.length ? parts : [r];
    });
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const headers = Array.isArray(d.headers) ? (d.headers as string[]) : [];
    for (const k of ["data", "rows", "result", "records"]) {
      if (Array.isArray(d[k])) {
        const rows = d[k] as unknown[];
        return { rows: norm(rows, headers), live: true, columns: headers };
      }
    }
    if (Array.isArray(data)) return { rows: norm(data as unknown[], headers), live: true, columns: headers };
  }
  if (Array.isArray(data)) return { rows: norm(data as unknown[], []), live: true, columns: [] };
  return { rows: [], live: true, columns: [] };
}
