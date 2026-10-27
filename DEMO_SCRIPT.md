# Demo Video Script — Tech Stack Advisor (3:00–3:30, hard cap 4:00)

Record at 1080p, browser zoom 110–125%, terminal font large. BEFORE recording:
clear terminal history, close/hide `.env`, never open key pages. Masked env
(`ZETARIS_API_KEY=***`) is safe to show; real values never.

## 0:00–0:20 Problem (slides.html cover)
> "Our entry is for The Agent That Can Explain Why. Tech leads picking React
> or Vue today decide on blogs and vibes — a wrong bet costs months of
> rewrite. The signals exist but live in scattered systems."

## 0:20–0:50 Architecture (flowey diagram, slides page 3)
> "Five agents, and it is not a chain. The Planner splits the question into
> SQL, the Retriever pulls Zetaris plus H-MEM memory, the Summarizer connects
> findings, the Critic can reject thin evidence and force one revision, and
> the Writer answers. Every handoff lands in a JSONL trace."

## 0:50–1:40 Live run (terminal, real input)
Run (input may take ~80s on slow tables — start it, cut the wait, keep
input and output real; never show `.env`):
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d @input_examples/example_1.json
```
> "Real run, React or Vue, through POST /run. Watch the Retriever hit both
> advisor tables through Zetaris."

## 1:40–2:20 Collaboration (trace from logs/, e.g. trace-example-001)
Show these two real moments:
1. Critic: `Revision requested: No rows seen for ... all_downloads_table`
   → Retriever revises (`revision_count: 1`).
2. H-MEM: `Recalled 4 memories` before querying.
> "The Critic rejected the downloads evidence because Zetaris timed out, and
> forced a second pass. That back-and-forth is in the trace, not in slides."

## 2:20–2:50 Sponsor tech (Zetaris SQL screenshot + Nightshift Providers)
> "Zetaris is the only data door: repo_health live in seconds — 251,863 stars
> for react. Every model call goes through Nightshift to Nemotron; the trace
> names the model per request. H-MEM smoke suite passes 10/10."

## 2:50–3:20 Output + impact (chat.html verdict card)
> "The answer cites its SQL per claim, states confidence, and says plainly
> what evidence is missing instead of inventing downloads numbers. A tech
> lead can act on this tonight."

## Shot list / checklist
- [ ] 1–4 min, audio clear, text readable
- [ ] Track + user named in first 20s
- [ ] Real run (input AND output real; wait may be cut)
- [ ] Trace collaboration moment on screen
- [ ] Zetaris + Meterless visibly working, model named
- [ ] No keys/secrets visible (check frame by frame)
- [ ] MP4 named e.g. `OAH2026-TechStackAdvisor-ExplainWhy-Demo.mp4`
- [ ] Backup copy + README link + private-window playback test
