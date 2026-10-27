# Slide Narration Script — Tech Stack Advisor (English, ~3:00)

Press `N` to show speaker notes. Advance with `→` or `Space`.
Setup before you start: server running (`npm start`), `chat.html` open in a
second tab, slides open, browser zoom 110%.

## Slide 1 — Cover (0:00–0:15)
> "Our entry is for The Agent That Can Explain Why. I am [name], with my
> teammate [name]. Every tech lead has asked this question: should we adopt
> React or Vue? Today that decision runs on blogs and vibes — and a wrong
> bet costs months of rewrite. Our Tech Stack Advisor answers it with live
> data, not opinions."

## Slide 2 — Problem → Solution (0:15–0:45)
Point left, then right.
> "The pain is on the left: the signals — stars, downloads, maintenance —
> live in three-plus places and go stale. Our solution is one call:
> POST /run with the question. About six seconds later you get a verdict,
> every claim carrying its source, a confidence score, and an honest list of
> what the evidence does not cover. These numbers are from a real run:
> React at 251 thousand stars and 123 million weekly downloads, Vue at 212
> thousand and 11 million — both tables cited."

## Slide 3 — Architecture (0:45–1:15)
Walk the diagram left to right, then point at the orange loop line.
> "Five agents, and the shape matters. The Research Planner splits the
> question into SQL. The Retriever pulls live rows through Zetaris and
> recalls past runs from H-MEM memory. The Summarizer connects findings.
> The Critic checks every claim — and here is the loop that makes this not
> a pipeline: thin evidence gets sent back for exactly one revision, and
> that rejection is logged in the trace. The Report Writer then answers
> through Nightshift on NVIDIA Nemotron."

## Slide 4 — How it works (1:15–1:45)
Left box, then right box.
> "Data on the left: two live sources, zero ETL — repo health in about five
> seconds, npm downloads beside it. Unique point: header-auth REST plus
> flatten views, so a third framework is two lines of SQL. Memory and model
> on the right: every Zetaris result is mined into H-MEM, the next run
> recalls it — you will see Recalled N in the trace — and Nightshift routes
> each request to Nemotron, logging which model handled it."

## Slide 5 — Stack + proof (1:45–2:25)
Read the table top to bottom, then each screenshot.
> "Small, boring, reproducible: Node plus tsx, one POST /run endpoint,
> Zetaris Docker for data, H-MEM plus Nightshift for memory and models.
> Three commands reproduce everything from a clean clone. And nothing here
> is a stock image: the verdict card with 1 of 2 sources live, the thinking
> view with live per-query progress, the Zetaris workspace showing two live
> rows with Success, and the Nightshift Providers page with NVIDIA stored."

## Slide 6 — Future (2:25–2:45)
> "Honest limits first: S3-backed tables can be slow, so they fall back to
> labeled samples, and slow npm tables are reported, never invented. Next:
> OSV vulnerability data, the vuejs/core repo, memory-strategy shootouts,
> and local lanes with reranking. The repo, the traces, and this deck all
> reproduce from a clean clone. Thank you."

## If asked (30-second answers)
- **"What if Zetaris is down?"** — "SAMPLE_MODE runs the full loop on
  labeled samples; a total miss returns an explicit failure with Retry,
  never a fabricated answer."
- **"Why not just a chain?"** — "The Critic has veto power and the revision
  is in the trace with revision_count — a chain cannot send work backwards."
- **"What did Nightshift/NVIDIA do?"** — "Every model call routes through
  Nightshift to Nemotron; each trace row carries mode and model."
