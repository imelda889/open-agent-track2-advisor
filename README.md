# Track 2: Tech Stack Advisor (my-agent)
**Track:** The Agent That Can Explain Why — agents that investigate complex
questions across multiple data sources, connect findings, and produce
evidence-backed answers.

Evidence-backed framework recommendation over Zetaris data with Meterless
H-MEM memory. Planner -> Retriever -> EvidenceSummarizer -> InsightCritic
(+1 revision loop) -> ReportWriter, JSONL traces in `logs/`.
Demo: "React or Vue for a new web project?" answered from live GitHub +
npm evidence in ~7s.

## Quickstart (submission entry point)

```bash
npm install
npm run setup        # vendors H-MEM reference into vendor/ (gitignored)
npx tsx server.ts    # POST /run on http://localhost:8000
```

```bash
curl -X POST http://localhost:8000/run -H "Content-Type: application/json" \
  -d @input_examples/example_1.json | python3 -m json.tool
```

Env (see `.env.example`, never commit `.env`):
`ZETARIS_BASE_URL`, `ZETARIS_ORG_ID`, `ZETARIS_API_KEY` (or USERNAME/PASSWORD),
`SAMPLE_MODE=true` runs offline with sample rows (labeled `zetaris:sample`).

## Sponsor tech (for metadata.json + judges)

- Zetaris (`src/zetaris.ts`): UI-proxy route POST `/api/proxy/sql-editor/sqls/run-query`
  with Bearer + X-Org-ID + X-Request-ID. Live sources (all <10s):
  `advisor.all_repo_health_table` (GitHub: stars, forks, open issues, last
  push, license), `advisor.all_downloads_table` (npm weekly downloads).
  Source recipes: `getting-started/open_data/rest_apis/sql/non_rate_limited/10_advisor_*`.
  S3 sample DBs (`NY_TAXI`, `TPCDS_DB`) are wired with LIMIT and fall back
  honestly to `zetaris:sample` on timeout.
- Meterless (`src/meterless.ts` + `src/llm.ts`): H-MEM mining/retrieval/ledger/sleep
  (reference suite `vendor/hmem/test/smoke.test.ts`: 10/10 pass).
  Nightshift is wired as primary AI provider (OpenAI-compatible
  `METERLESS_BASE_URL`, default `http://127.0.0.1:8088/v1`, model
  `meterless/auto`, bearer `METERLESS_RUNTIME_TOKEN`); every `/run`
  response + trace logs `ai_provider.mode/model` per request. Until the
  Nightshift app is installed the agent uses an evidence-grounded
  retrieval fallback, honestly labeled — install Nightshift for the
  model-written recommendation.
- Built with AI coding assistants (OpenCode); heavy generation assisted, final edits/runs reviewed by the team.
- NVIDIA: no GPU workload in this evidence-QA path yet.

## Limits

- S3-backed table scans are slow on a 2-core laptop (60s per-query timeout,
  then labeled `zetaris:sample` fallback for S3-family tables). REST-backed
  sources answer in seconds.
- Retrieval-only answer mode by default (no model key needed); install
  Nightshift for model-written recommendations.
- Findings show correlation from retrieved rows, not proven causation.

## Demo Video

Demo video (1–4 min): [upload to HackOS and paste link here]

## Failure handling

| Failure | Behaviour |
|---|---|
| Zetaris source timeout (60s) | S3-family tables fall back to labeled sample rows; other tables report 0 rows honestly, no wrong-domain data |
| Empty result (0 rows everywhere) | Structured failure message + Retry instead of a fabricated answer |
| Unsupported claim | InsightCritic blocks it and requests one revision (see `revision_count`) |
| Malformed input | `400` with a validation message (`user_query is required`) |
| Nightshift unreachable | Retrieval-only evidence answer, honestly labeled |

## Pre-existing components (declared)

- `agentathon-starter` scaffold (Meterless template: `notebook.ts`, `seed/`,
  H-MEM reference vendored via `npm run setup` into gitignored `vendor/`).
  All agent logic (`src/agents.ts`, `src/zetaris.ts`), `server.ts`, `chat.html`,
  `slides.html` and this README's Track 2 sections were built 22–27 Oct 2026.
- Open-source libraries per `package.json` / `vendor/hmem` (H-MEM reference,
  MIT). Flowey (MIT) was used only to render the architecture diagram for
  the slide deck, not in the submitted agent.

---
# Agentathon Starter (upstream docs below)

A CLI agent whose memory is real H-MEM: it mines what you tell it, ranks what it recalls, explains where every answer came from, and remembers across runs. Zero API keys. Your hackathon project starts by replacing the CLI with your own surface and keeping the memory spine.

<img src="images/notebook-loop.svg" alt="Animated: notebook commands run in a terminal while each one maps to a named H-MEM service: remember to MemoryMiningService, ask to MemoryRetrievalService, audit to TrustLedgerService, sleep to SleepCycleService" width="820" />

## Two minutes to first recall

```bash
npx degit meterless/meterless/templates/agentathon-starter my-agent
cd my-agent
npm install
npm run setup        # REQUIRED: vendors the H-MEM reference into vendor/ (gitignored)

npx tsx notebook.ts seed
npx tsx notebook.ts ask "what did we decide about storage"
```

Step 4 is not skippable: `vendor/` is gitignored, so a fresh clone has no engine until setup runs. The startup line always names which engine source loaded.

Quit the terminal, come back tomorrow, ask again: it still remembers. That persistence (`.notebook/`, also gitignored) is the demo.

## Commands

```bash
npx tsx notebook.ts remember "We always deploy on green CI"
npx tsx notebook.ts ask "when do we deploy"
npx tsx notebook.ts audit mem-1        # the memory's append-only ledger history
npx tsx notebook.ts sleep --preview    # consolidation plan, nothing applied
```

## Where the engine is used (judges look here)

The rubric weights "Meterless engine usage" at 25%. Every command routes through a named H-MEM service; nothing is faked:

| Command | Engine service | Spec section |
|---|---|---|
| `remember` | MemoryMiningService (model-free path) + MemoryStoreService | AGENTS.md 4, 3 |
| `ask` | MemoryRetrievalService (hybrid formula, reinjection, trace) | AGENTS.md 6 |
| `audit` | TrustLedgerService (append-only history) | AGENTS.md 9 |
| `sleep` | SleepCycleService (preview-first, guardrails, backup) | AGENTS.md 8 |
| answer quality over time | feedback deltas are one call away: `hmem.feedback(id, "helpful")` | AGENTS.md 9.2 |

## Add a real model (optional)

The default answer mode is retrieval-only and fully offline. With a key:

```bash
npm install @anthropic-ai/sdk
ANTHROPIC_API_KEY=... npx tsx notebook.ts ask "what did we decide about storage"
```

The reinjected memory block goes into the prompt; the answer cites memory ids. Both modes are labeled in the output.

## Extension ideas by track

- **Memory agents**: extend mining with your own event types; wire `feedback` to thumbs up/down; build the dream review UI.
- **Desktop agents**: pair the notebook with Relay-style execution; memories become preconditions for actions.
- **Creative swarms**: when the swarm orchestration engine drops, fan out variants and remember which ones the user kept.
- **Enterprise workflow**: point `remember` at your CRM export; `ask` becomes account context on demand.

Rubric and tracks: [docs/community/hackathon-guide.md](../../docs/community/hackathon-guide.md). Engine spec: [engines/hmem/AGENTS.md](../../engines/hmem/AGENTS.md).
