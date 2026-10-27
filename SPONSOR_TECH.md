# Sponsor Technology Explanation (paste into HackOS form)

## Zetaris — the agent's data layer
All evidence comes through Zetaris as the single SQL access point
(`src/zetaris.ts`, UI-proxy route
`POST /api/proxy/sql-editor/sqls/run-query` with Bearer + `X-Org-ID` +
`X-Request-ID`). The Retriever queries `advisor.all_repo_health_table`
(GitHub stars/forks/issues, live in ~5s, e.g. react/react 251,863 stars) and
`advisor.all_downloads_table`, plus S3-family tables with `LIMIT` and an
honest labeled `zetaris:sample` fallback on timeout. Every finding in every
answer cites the exact SQL that produced it. Remove Zetaris and the agent has
no evidence — it refuses to answer rather than fabricate (0-row runs return a
structured failure + Retry).

## Meterless — memory engine + model runtime
- **H-MEM engine** in a working feature: the Retriever recalls past runs
  (`Recalled N memories`) and mines each Zetaris result back into memory, so
  answers compound across runs. Provenance: `vendor/hmem/test/smoke.test.ts`
  **10/10 pass** (verified 27 Oct 2026, vitest), engine source logged per run
  (`memory_source` in every `/run` response).
- **Nightshift as primary AI provider**: ReportWriter calls the
  OpenAI-compatible endpoint (`METERLESS_BASE_URL`, default
  `http://127.0.0.1:8088/v1`, model `meterless/auto` → NVIDIA Nemotron).
  Every response and every trace row logs `ai_provider.mode` + `model`, so
  judges can see exactly which model handled each request. Without Nightshift
  installed the agent degrades honestly to retrieval-only mode, labeled in
  the output.

## NVIDIA — where it contributes
Reasoning runs on NVIDIA Nemotron models through Nightshift (Providers tab:
NVIDIA key stored in daemon, screenshot in deck). Per-request model
attribution in trace + response is the award evidence.

## AI coding tool
Built with the OpenCode AI coding assistant (generation assisted, every
change reviewed by the team). Cursor was not used.

## What was unique
Not the sponsors used, but the honesty contract between them: the Critic can
only approve claims with retrieved rows behind them, sample data is always
labeled `zetaris:sample` and never crosses domains (no NY_TAXI rows for npm
questions), and a total miss returns an explicit failure instead of a
confident-sounding answer.
