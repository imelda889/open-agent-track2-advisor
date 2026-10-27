# Full Talk Script — Tech Stack Advisor (humanized, ~3:00)

Setup: server running (`npm start`, leave the window open), `chat.html` open
in tab 2, slides open, zoom 110%, press `N` for notes. Breathe. Smile on
slide 1. Total ~3 minutes — if you speak at normal speed you will land it.

---

## 0:00 — Hello (cover slide)

> "Hi everyone! My name is Chong Xin Yi, with my friend Tan Yoke Ling.
> Our topic is the Tech Stack Advisor, for the track The Agent That Can
> Explain Why. We use Zetaris as our data layer, Meterless for memory and
> models, and NVIDIA Nemotron for reasoning."

Pause one beat, then the hook:

> "So — picture this. You are a tech lead, it is 9pm, and your CTO asks:
> React or Vue for the new project? You open some blogs, everyone disagrees,
> and a wrong bet costs your team months of rewrite. We built the agent
> that answers that question with live data instead of opinions."

## 0:25 — Problem and solution (slide 1)

Gesture left, then right.

> "The problem is on the left. Tech leads decide on vibes because the real
> signals — GitHub stars, npm downloads, maintenance activity — live in
> three different places and go stale the moment you copy them into a doc.
> Our users are tech leads and CTOs who decide tonight, not next quarter.
> The solution is on the right, and it is one call: you POST your question
> to /run, and about six seconds later you get a verdict. Not just an
> answer — every single claim carries the query that produced it, plus a
> confidence score, plus an honest list of what the evidence does NOT cover.
> And these numbers are real, from a live run: React, 251 thousand stars
> and 123 million weekly downloads. Vue, 212 thousand stars and 11 million.
> Both tables cited, nothing invented."

## 0:55 — Architecture (slide 2, the flowey diagram)

This is the most important 40 seconds. Walk it left to right with your
cursor. Slow down on the orange loop.

> "Okay, this is the architecture diagram, the overall look of our system.
> Let me walk you through exactly what happens if a user asks: should we
> adopt React or Vue?
> First, the Research Planner reads the question and splits it into SQL —
> one query against the repo-health table for stars, forks and issues, and
> one against the downloads table for npm numbers.
> Then the Retriever runs both on Zetaris — that is our live data door —
> and at the same time it asks H-MEM, our memory: have we seen anything
> like this before? You will see Recalled N memories in the trace.
> The Summarizer connects the findings into a draft. Then comes the part
> that makes this an agent system and not a pipeline: the Critic. The
> Critic checks every claim against retrieved rows. If the evidence is
> thin — say the downloads table timed out — it rejects the draft and
> sends it back for exactly one revision. You can see that rejection,
> word for word, in our trace logs.
> Finally the Report Writer answers through Nightshift on NVIDIA Nemotron,
> with the model name stamped on every request."

Point at the orange loop line:

> "Remember this loop. Chains go forward; agents go back. That is the
> whole difference, and the judges can verify it in our logs."

## 1:35 — How it works (slide 3)

Left box, then right box.

> "Data on the left: two live sources, zero ETL. Repo health answers in
> about five seconds. And the unique bit: it is header-auth REST plus
> flatten views, so adding a third framework is literally two lines of SQL.
> Memory and model on the right: every Zetaris result gets mined into
> H-MEM, so the next run starts smarter — and every model call is routed
> through Nightshift to Nemotron. One line to remember: evidence goes in,
> memory compounds, recommendation comes out. A closed loop."

## 1:55 — Stack and proof (slide 4)

Read the table top to bottom, then show each screenshot like family photos.

> "The stack is deliberately boring: Node plus tsx, one POST /run endpoint,
> Zetaris Docker for data, H-MEM plus Nightshift for memory and models.
> Three commands reproduce everything from a clean clone.
> And I want to stress: nothing on this page is a stock image. This is our
> verdict card showing 1 of 2 sources live. This is the thinking view with
> live per-query progress while it runs. This is the Zetaris workspace
> showing two live rows with Success. And this is the Nightshift Providers
> page with NVIDIA stored. Real artifacts, all of them."

## 2:25 — Zetaris SQL, explained (stay on slide 4, point at screenshot 2)

Say this slowly; judges score Sponsor Tech here.

> "Let me explain the SQL, since this is where Zetaris earns its place.
> Query one: SELECT star, forks, open issues and last push from the
> repo-health table, limited to 20 rows — that is community health and
> maintenance activity, live in seconds. Query two hits the downloads
> table — that is real adoption, not vibes. Both go through one access
> point, so our agent never maintains connectors. And when a table is
> slow, we do not fake it: S3 tables fall back to clearly labeled samples,
> and anything else reports zero rows honestly. No NY_TAXI rows ever
> pretend to be npm data."

## 2:50 — Future and thank-you (slide 5)

> "Honest limits first: slow tables get labeled samples, missing evidence
> gets stated, never invented. Next up: vulnerability data, the vuejs/core
> repo, memory-strategy shootouts, and local lanes with reranking. The
> repo, the traces, and this deck all reproduce from a clean clone.
> Thank you — happy to take questions."

## If asked (keep each under 30 seconds)

- **"What if Zetaris is down?"** — "Flip SAMPLE_MODE and the full loop
  still runs on labeled samples for a demo. A total miss returns an
  explicit failure with a Retry button — we would rather say nothing than
  invent numbers."
- **"Why is this not just a chain?"** — "Because work flows backwards:
  the Critic vetoed our downloads evidence in a logged run and forced a
  second pass. A chain cannot do that; ours has revision_count in the
  output to prove it."
- **"What did NVIDIA actually do?"** — "Every reasoning call runs on
  Nemotron through Nightshift, and each trace row names the exact model
  that handled it. That attribution is in the logs you can open right now."
- **"Who is this for?"** — "Tech leads and CTOs deciding tonight. The
  output is written so they can act on it tonight: numbers, sources,
  confidence, and gaps."
