# Repository Guidelines

## Project Overview

University coursework for "English Writing and Presentation Skills" (Phenikaa School of Computing, October 2026). The repo produces three linked artifacts about one research study — comparing an autonomous LLM agent against a hybrid classifier-plus-rules pipeline (the "Jev pipeline") for consequential customer-support actions:

- A generated presentation deck (`slides/deck.pptx`, 29 slides).
- The experiment behind it (`experiment/`, Bun + TypeScript, calls real LLM APIs).
- A LaTeX paper (`paper.tex`, mirrored in `overleaf/`) and talk scripts (`talk_notes/`).

Presentation title (fixed by team decision): **"Structured Decision Gates for Customer Support Agents: Intent Detection and Rule Checks"**.

## Architecture & Data Flow

```
experiment/build_dataset.ts  ->  data/high-impact/{world,requests}.csv   (deterministic, seed 20261007)
experiment/run.ts --level 2|3 ->  results/<run-tag>/levelN/{results,per_case,provenance}.json + failures/
                                  (Level 2 = single autonomous LLM agent; Level 3 = Jev classifier
                                   answers yes/no rule questions, code runs the action, LLM writes the reply)
slides/build.js              ->  reads results JSON, writes deck.pptx via pptxgenjs
slides/render.sh             ->  validate.py (OOXML schema) -> LibreOffice -> deck.pdf -> preview JPEGs
slides/make_image_deck.js    ->  deck-images.pptx (one full-bleed image per slide, for Google Slides)
figures.ts / tables.ts       ->  SVG->PDF figures and LaTeX tables for the paper
```

Key idea of the study: Jev never acts. It answers typed labels and one yes/no question per rule; fixed code applies the answers and runs the action; the LLM only drafts the final reply. This is "fixed execution", not independent policy verification.

## Key Directories

- `slides/` — deck generator. `build.js` is the single large source (all 29 slides); `cases.js` holds the three morph walk-through scenarios; `charts.js` post-processes chart XML; `transitions.js` injects Morph `<p159:morph>` XML with a fade fallback.
- `experiment/` — the study. `system/` simulates the SaaS product (accounts, written rules, actions); `notes/*.md` document ablation/robustness/screening methodology; `results/` holds run outputs (dated, tagged, immutable).
- `talk_notes/` — per-speaker scripts (`speaker_1..5.md`), timing/slide allocation (`README.md`), Q&A prep (`qa.md`).
- `figures/`, `overleaf/` — TikZ flow diagrams and the Overleaf copy of the paper.
- Root `*.docx` — course-provided templates and grading criteria (reference only).

## Development Commands

```bash
# Slides (Node.js + pnpm, run from slides/)
./render.sh                 # build.js -> validate.py -> soffice -> deck.pdf -> preview-*.jpg
pdftoppm -jpeg -r 150 deck.pdf /tmp/gimg/s && node make_image_deck.js /tmp/gimg   # Google-Slides-safe copy

# Experiment (Bun, run from repo root)
bun run experiment/validate.ts                 # dataset integrity + oracle policy check; exit 1 on violation
bun run experiment/run.ts --level 2            # requires --level 2 or --level 3
bun run experiment/run.ts --level 3 --offline  # replay from cache, no network, no API key
bun run experiment/run.ts --limit 8 --no-report # quick smoke run
bun run experiment/build_dataset.ts            # regenerate data/high-impact (deterministic)
cd experiment && pnpm run typecheck            # tsc, strict, noEmit
```

Useful `run.ts` flags: `--out`, `--cache`, `--data`, `--requests`, `--offline`, `--limit`, `--no-report`, `--jev-workers`, `--llm-workers`. Analysis scripts (`ablation.ts`, `robustness.ts`, `screen.ts`, `neutrality.ts`) accept `--offline` and read cached runs.

## Code Conventions & Common Patterns

**Slides (CommonJS, plain JS):**
- Shared helpers in `build.js`: `base(n, title, notes)` (standard slide + speaker note), `box`, `textBox`, `line`, `iconCircle`, `statCard`, `callout`, `band`, `bullets`, `pts` (inch margins -> pptxgenjs points).
- Icons: Lucide icons from `react-icons/lu`, rendered via `renderToStaticMarkup` and rasterized to PNG with `sharp` (cached in memory as base64 data URIs). Custom arrows/curves are also SVG -> PNG via sharp; never embed raw SVG.
- Morph transitions: objects that must animate between consecutive slides get `objectName` values starting with `!!` and identical names on both slides (helper `named(prefix, force)`); `transitions.js` also deduplicates shared media by SHA-1 so morph moves images instead of cross-fading.
- `build.js` asserts dataset consistency at build time (26 categories in 5 groups, 2 requests per 512 customers, level 3 faster/cheaper/fewer errors than level 2). Do not weaken these checks.
- `charts.js` strips blank chart points from `ppt/charts/chart*.xml` so converters do not render stray zeros; it throws if nothing was stripped.

**Experiment (Bun TypeScript):**
- `tsconfig`: ES2023, `strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noEmit`, types `["bun"]`. Node imports use the `node:` prefix. No emit step.
- HTTP caching in `transport.ts`: cache key is SHA-256 of canonical JSON `{service, url, body}` with sorted keys; atomic writes via temp file + rename; caches replay latency too, so `--offline` reproduces timings exactly. Failed calls (after 2 retries) write evidence JSON to `<out>/failures/<service>-<hash16>.json`.
- Timestamps are ISO-8601 UTC with `Z` suffix (`generated_utc`, `started_utc`).
- Run outputs are never overwritten in place: new runs get a fresh `results/high-impact-YYYYMMDD-<tag>/` directory.

**Content rules (enforced by team decision, apply to slides and notes):**
- Visible slide text and spoken scripts are plain English: short sentences, B1 vocabulary, no em dashes, no semicolons, active voice.
- Banned words on slides and in notes: "automation", "autonomous", "versus"; the fictional company name "FrameForge" appears only in `paper.tex` and `experiment/` code — the deck says "a made-up AI video maker service company".
- The opening slide introduces the subject only; it does not judge or preview later material.
- Quiz questions (slides 3-4, interactive ones from slide 5 on) must lead into the next slide's content.
- The conclusion slide makes no "future work" claims.
- Language split: everything in the repo is English; only `talk_notes/` stage directions (e.g. `[NGHỈ 1 GIÂY]`, `[CHUYỂN SANG SLIDE 22]`) and headers may be Vietnamese. Spoken lines in blockquotes are English.
- Speaker mapping (fixed): Tran Thanh Long slides 1-20 + Q&A; Nguyen Thanh Nam 21-22; Vu Van Son 23-24; Vuong Quang Quy 25-26; Nguyen Phuong Nam 27-28. Slide 29 is Q&A (untimed).

## Important Files

- `slides/build.js` — the whole deck; edit here, then `render.sh`.
- `slides/cases.js` — the three walk-through scenarios (refund allowed, refund denied, hidden injection order).
- `slides/render.sh` — build + validate + PDF + previews; the single entry point for slides.
- `slides/make_image_deck.js` — image-based deck copy; keep in sync after every `render.sh`.
- `experiment/run.ts` — runner (level flag required); `experiment/pipeline.ts` — per-request flow and outcome/cost logic.
- `experiment/system/saas.ts` — the written rules, triage, and account model (the policy under test).
- `experiment/jev_rules.ts` / `jev_classifier.ts` / `llm_agent.ts` — the two decision designs.
- `experiment/dataset.ts` — dataset schema, quotas, gold classifier.
- `talk_notes/README.md` — slide-by-slide speaker and timing table; update word counts there when editing scripts.

## Runtime/Tooling Preferences

- `slides/`: Node.js + pnpm (`pnpm-lock.yaml`); deps: pptxgenjs, jszip, sharp, react. No package scripts; run files directly.
- `experiment/`: Bun (>= 1.1) + TypeScript; deps installed via pnpm/bun lock; run with `bun run`, typecheck with `pnpm run typecheck`.
- PDF/preview tooling: LibreOffice (via `../.omp/skills/pptx/scripts/office/soffice.py`), `pdftoppm`, and `rsvg-convert` (experiment figures). The pptx OOXML validator lives under `.omp/skills/pptx/scripts/office/validate.py`.

## Testing & QA

- No unit-test framework. QA is assertion-based:
  - `slides/render.sh` fails the build on OOXML schema violations (validate.py) and on LibreOffice conversion errors; `build.js` throws on dataset-consistency and headline-claim violations (speed, cost, error counts).
  - `experiment/validate.ts` verifies CSV schema, per-category quotas, text uniqueness, and replays the gold classifier over the dataset without model calls.
  - `bun run experiment/run.ts --limit N` is the fast smoke path; `--offline` reproduces a past run exactly from cache.
- When changing headline numbers on slides, they must come from the matching `results.json`; never hand-edit figures in `build.js`.
- Do not modify: `experiment/data/**` (benchmark gold data), `experiment/results/**` (recorded runs, provenance, API caches), `experiment/screen_handread.json` (human ground truth), or prompts/policies in `experiment/system/` — they define the published study.
