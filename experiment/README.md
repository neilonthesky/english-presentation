# Customer Support Triage Experiment (Flow v26)

This directory runs the request triage system of the FrameForge support demo (`web/`) as an experiment. The product is FrameForge, an AI video-generation SaaS where customers purchase subscription plans (Free, Pro, Team) and credit packs to generate short video clips.

The experiment evaluates live and cached requests against the triage state machine without duplicating code: it directly executes `web/server/saas.ts`, `web/server/steps.ts`, and `web/server/models.ts`.

The paper reads the experiment as a **three-rung ladder** of the support workflow. Each rung adds one part to the rung before:

0. **Staff only.** Support staff read every request. No model runs.
1. **LLM + rules.** An LLM classifies the request, and the written rules check its action. There are no rules of Triage (no Critical, no injection rule, no confidence floor, no "Needs staff" rule, no risk rule), no Clarify, and no support staff. A denied action runs nothing, a review runs nothing (no support staff can take it), and a request whose correct result is Queued is not helped.
2. **Jev + LLM + rules + staff.** Jev replaces the LLM as the classifier, the rules of Triage run, the confidence floor and Clarify handle an unsure answer, support staff take the requests that need them, and the LLM writes the text only.

The rungs run the same pipeline (`pipeline.ts`) over the same classifier input: classify, Clarify when the classifier is unsure, Gather info, Rules check, Do action, Final message, or Queued at rung 2. Rung 1 stops at the written rules: no Triage and no Queued. The routing of a system is `ROUTING` in `pipeline.ts`.

The run also executes a third system, **`llm`**, which is **not a rung**: it is the classifier reference run (the same LLM with the rules of Triage and support staff). It gives the LLM side of the classifier-stage table (RQ3: Jev against the LLM per field, ECE, latency, tokens, cost). Its ladder numbers are not reported as a rung.

---

## File Structure

```
types.ts           TypeScript interfaces (TestRequest, Gold, FinalResult, Classifier, etc.)
dataset.ts         CSV parser and serializer for world.csv and requests.csv
data/world.csv     72 synthetic customer accounts with plan/credit purchases
data/requests.csv  100 customer requests (50 dev, 50 test) across 21 categories with clarification text
build_dataset.ts   Dataset generator with fixed seed 20261005 (and 20261006 for the extra request of a type)
validate.ts        Checks dataset integrity and runs an oracle classifier (zero models called)
transport.ts       Recording and replaying transport with canonical sha256 request caching and a bounded retry
llm_classifier.ts  Triage classification implementations (Jev and LLM baseline)
pipeline.ts        The flow of one request (Triage -> Clarify -> Gather info -> Rules check -> Do action -> Final message / Queued),
                   the rung-1 routing (decideRules), the ladder prices (PRICE), and the per-request record
metrics.ts         Metric computation (rates, times, tokens, cost), ECE calibration, the three-rung ladder, and results.json
faults.ts          Fault injection test suite (forged classifiers, tampered parameters, adversarial text)
tables.ts          LaTeX table exports for paper inclusion (data.tex, ladder.tex, stage.tex, fault.tex, calibration.tex)
figures.ts         SVG and PDF chart exports (classifier, ladder, reliability, floor, choose_floor, choose_rounds)
sweep.ts           Grid sweep reader and decision rule evaluator across confidence floor T and clarify rounds N
neutrality.ts      The neutrality probe: one Jev call on a state that carries no request -> results/neutrality.json
run.ts             Command-line entrypoint for single runs, sweeps, and offline replay
results/           Output directory containing results.json, per_case.json, provenance.json, neutrality.json, tables/,
                   figures/, requests/ cache, sweep/ (test), sweep_dev/ (dev)
```

---

## Prerequisites

* **Runtime**: [Bun](https://bun.com) (>= 1.1).
* **Credentials**: Environment variables `TYPESAFE_API_KEY` (Jev classifier) and `COMMAND_CODE_API_KEY` (DeepSeek LLM baseline and text generation). Alternatively, `omp token typesafe` and `omp token commandcode`.
* **Dataset Generation**: Run `bun run experiment/build_dataset.ts` once to generate `data/world.csv` and `data/requests.csv`. Validate using `bun run experiment/validate.ts`.

---

## Commands

```sh
# Show available CLI flags
bun run experiment/run.ts --help

# Run the test split with live calls / disk cache (default parameters: floor 0.6, rounds 1)
bun run experiment/run.ts --cache experiment/results/requests

# The run of the paper: the chosen parameters (floor 0, Clarify rounds 0), with the tables and the figures
CONFIDENCE_FLOOR=0 CLARIFY_ROUNDS=0 bun run experiment/run.ts --split test --out experiment/results --cache experiment/results/requests

# Refresh one point of a sweep grid (each grid is 7 floors x 2 rounds; run.ts reads the other points)
CONFIDENCE_FLOOR=0.6 CLARIFY_ROUNDS=1 bun run experiment/run.ts --split dev --out experiment/results/sweep_dev/floor_0.6_rounds_1 --cache experiment/results/requests --no-report

# Replay without network access (zero live calls, the same numbers)
bun run experiment/run.ts --offline --cache experiment/results/requests

# The neutrality probe of the criteria: one Jev call on a content-free state
bun run experiment/neutrality.ts

# Check dataset consistency and oracle assertions
bun run experiment/validate.ts

# Read the two sweeps and print the choice of the two parameters
bun run experiment/sweep.ts
```

A run makes a live call only for a model call that the cache does not hold; every answer is recorded under `<cache>/<service>/<sha256>.json` with the latency of the original call, so `--offline` replays exactly the same numbers.

---

## The Support Flow (v26)

Rung 2 follows the formal triage state machine:

1. **New**: Customer message received.
2. **Triage**: the classifier answers 5 attributes: Queue, Action, Priority, Risk flag, Injection flag.
3. **Routing Rules**:
   - `priority = Critical` -> **Queued** (rule `critical`).
   - `injection = true` -> **Gather info**, orders ignored, action forced to `Send reply` (rule `injection`).
   - `min(chance(queue, action, risk)) < CONFIDENCE_FLOOR` -> **Clarify** if `round < CLARIFY_ROUNDS`, else **Queued** (rule `unsure`).
   - `action = "Needs staff"` -> **Queued** (rule `needs-staff`).
   - `risk = true` and action has no written rule -> **Queued** (rule `risk`).
   - Otherwise -> **Gather info** (rule `answer` or `act`).
4. **Clarify**: if unsure, the LLM writes a clarifying question (`writeClarify`), the simulated customer replies with the category clarification, and the classifier answers again on the combined chat, up to `CLARIFY_ROUNDS` times.
5. **Gather info**: the account, the purchase state, the matching help articles, and the facts of the text (`extractFacts`).
6. **Rules check**: the written policy (`policyFor`) for the actions "Start refund" and "Delete data":
   - Verdict `allow` -> **Do action** -> **Final message**.
   - Verdict `deny` -> **Final message** (explains the refusal, nothing executed).
   - Verdict `review` -> **Queued** (support staff decide).
7. **Queued**: the chat is locked and awaits support staff. The experiment assumes 90 s (`STAFF_SECONDS`) of support staff time per request that reaches Queued.

Rung 1 (LLM + rules) runs New, Triage (the classifier), Gather info, Rules check, and Do action, and skips the routing rules of the state machine: the action of the classifier goes to the written rules at once (`decideRules` in `pipeline.ts`). The injection flag is not read, so orders in the text are not ignored, and no request reaches Queued: a `review` verdict and the action "Needs staff" run nothing, and the Final message explains. An answer that is not valid runs nothing and sends no message (the end `invalid`).

---

## The Neutral Criteria

Both classifiers (Jev at rung 2, the LLM at rung 1 and in the reference run) get the same five questions from `JEV_QUESTIONS` in `web/server/models.ts`, and no other words: no examples and no hint about a request type. `experiment/llm_classifier.ts` copies the instructions and every criterion entry into its system prompt, so the two classifiers cannot drift apart.

The wording was rewritten for neutrality. What changed, and why:

| Change | Reason |
| --- | --- |
| The action instruction no longer names "a refund or a deletion". | It named two of the four options before the model read the request. |
| One action rule for all four options ("the action that the request needs"). | "The customer asks for it" was on two options only. |
| The article rule moved into the shared instruction. | A document condition sat on two of the four options. |
| The risk flag is defined on money and stored data, not on a refund request of the customer. | The old `true` repeated the labels of two actions, so the flag added no signal. |
| Critical describes the harm and drops "fraud" and "stolen". | The old line repeated the Security criterion and two category names of the dataset. |
| Security describes the use of the account or the payment method by someone who is not the customer. | "Charges that the customer did not make" also fitted Payments. |
| Product Help is the leftover queue, in its own words. | The dataset uses it for topics that no other queue covers. |
| Refunds includes "the written policy for both". | The `lookalike_ask_rules` rows ask for the policy and are labeled `Refunds`. |
| The queue tie-break is one uniform order: Security, Payments, Refunds, Account, Plans and Credits, Product Help. | The old rule named the two preferred topics ("money or security"). |
| Every option of every question is one sentence of the same shape. | The old options ranged from 6 to 22 words. |
| The injection flag says "instructions" and "the way it works". | The injection test items say "rules", "checks", "policy", "override". |
| No example phrase of the test set appears in any criterion. | A criterion that repeats the test words measures keyword matching, not classification. |

The six queues, the four actions, the four priorities, and the two flags did not change.

**The state no longer names a queue.** The help articles of the demo (`web/server/saas.ts`) are part of the classifier state. Three of them named a team queue, so for those requests the queue answer was partly a lookup of a sentence: "Support staff in the Plans and Credits queue change it", "send the render job ID to Product Help, and the request goes to the Product Help queue", and "the request goes to the Security queue at once". The articles now keep the meaning (who does the work, and how fast) without the queue name: "Support staff change it for you", "send the render job ID, and a member of support staff looks at the job", and "support staff look at the request at once". The deletion article still says that support staff take over every deletion request, because that sentence is what makes the gold action of a deletion request "Needs staff".

The tests of the criteria that the paper can report from this experiment are the content-free probe (below). The order test, the label-swap test, the cue-ablation test, the reader test, and the paraphrase test were **not** run; `results/neutrality.json` lists them under `not_checked`.

---

## The Dataset

`data/requests.csv` holds **100 requests: 50 in the dev split and 50 in the test split**, in 21 request types. Every request type is in both splits (2 or 3 requests per split; the 8 request types that carry the extra request are drawn with a seeded generator, seed 20261006). Every request has its own wording, its own clarification text, and a customer from `world.csv` (72 accounts).

Two gold labels were changed for the smaller set:

* `refund_in_window_large` is now **Medium**, not High. The request text does not say that a deadline is near, and the classifier state carries no amount, so the High criterion ("Money is taken by mistake") is an opinion that the text and the state cannot support. The written rules still send this request to support staff (a refund over $100 needs a check), so the gold final result did not change.
* Every request type keeps the priority that its own situation shows: 76 Low, 10 Medium, 10 Critical, 4 High (the High rows are the two mixed requests of each split).

The dataset has 64 risk-flag rows, 4 injection rows, 4 hard (mixed) rows, 4 teammate rows, 40 rows whose gold final result is Queued, and 20 rows where the written rules deny the asked action.

---

## Cost and Tokens

Every model call of a run is priced with the list price of its provider. The prices are constants in `pipeline.ts` (`PRICE`), in US dollars for one million tokens:

| Service | Input | Output | Source |
| --- | --- | --- | --- |
| Jev | 0.042 | 0 (free) | <https://docs.typesafe.ai/models>, <https://typesafe.ai/blog/introducing-system-one-models-and-jev> |
| DeepSeek V4.1 Flash (off-peak) | 0.15 | 0.60 | <https://api-docs.deepseek.com/quick_start/pricing/> |

The peak price of DeepSeek is twice these values. The experiment applies the off-peak list price above and the cache-miss price: the provider reports 0 cached tokens, because the prompt cache is not used.

`results.json` reports for every system:

* the API cost of every model call of the pipeline, in US dollars per 1,000 requests;
* the same for the classifier stage only;
* the latency of the classifier stage (median and 95th percentile);
* the tokens of one request, and the input and output tokens of one classifier call.

`tables/ladder.tex` carries the cost column of the three rungs and `tables/stage.tex` compares the two classifiers.

The output tokens of the LLM calls include the tokens of its reasoning: the provider reports `completion_tokens` and, inside it, `completion_tokens_details.reasoning_tokens`. The cost therefore covers the reasoning of the model. Jev reports one input and one output count for the whole answer.

---

## Retry and the Cache Key

The recording transport (`transport.ts`) tries a provider error again **at most twice** (three tries in total), after a short pause (500 ms, then 1000 ms). A provider error is a bad HTTP status, a broken connection (a closed socket, a timeout, a reset), or a chat answer with no text. Any other failure, and a failure of the last try, is written to `<out>/failures/` with the number of attempts and the failed request; the call is **never cached**, and the run continues with the other requests. A call that a new try repairs is recorded once, with the latency of the successful try. The two failed calls of the first attempt of one sweep point (a closed socket from the provider, before this retry existed) are reported in the honest limitations below.

The cache key is the sha256 of the canonical JSON `{service, url, body}`. No timestamp, no uuid, and no random value enters a request body:

* the Jev body is `{state, model, questions}`; `state` is the sender role, the channel, the text of the chat, and the matching help articles (`classifierState` in `models.ts`);
* the chat body is `{model, messages, temperature, max_tokens, reasoning_effort, stream}` (`chat` in `models.ts`).

The only clock values in the experiment are the provenance timestamps and the temporary file name of a cache write; neither is part of a body. Verified: an offline replay of the final run (`--offline --cache experiment/results/requests`) made **zero live calls** and reproduced every number of the live run (the ladder, the systems, the classifier stage, the reliability bins, the sign test, the dataset summary, and the random escalation are identical).

---

## Parameter Selection: Confidence Floor and Clarify Rounds

The Jev system exposes two triage parameters:
- `CONFIDENCE_FLOOR` (`T` in `{0, 0.2, 0.5, 0.6, 0.7, 0.8, 0.9}`)
- `CLARIFY_ROUNDS` (`N` in `{0, 1}`)

### Dev Selection Rule
1. For each rounds setting `N`, take the smallest confidence floor `T` that yields **0 silent errors** on the dev split.
2. Among these pairs, select the pair that minimizes the support staff rate.
3. Break ties by choosing the smaller `N`.

### The dev evidence

The Jev system on the dev split (50 requests per run):

| N | Floor | Silent errors | Staff % | Staff not needed | Clarify % | Unsure | Mean total s | API $/1k |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 60.0 | 10 | 0.0 | 0 | 56.5 | 0.12 |
| 0 | 0.2 | 0 | 60.0 | 10 | 0.0 | 0 | 56.5 | 0.12 |
| 0 | 0.5 | 0 | 64.0 | 12 | 0.0 | 4 | 60.0 | 0.12 |
| 0 | 0.6 | 0 | 76.0 | 18 | 0.0 | 16 | 70.0 | 0.10 |
| 0 | 0.7 | 0 | 80.0 | 20 | 0.0 | 25 | 73.5 | 0.09 |
| 0 | 0.8 | 0 | 86.0 | 23 | 0.0 | 30 | 78.5 | 0.08 |
| 0 | 0.9 | 0 | 88.0 | 24 | 0.0 | 35 | 80.2 | 0.07 |
| 1 | 0 | 0 | 60.0 | 10 | 0.0 | 0 | 56.5 | 0.12 |
| 1 | 0.2 | 0 | 60.0 | 10 | 0.0 | 0 | 56.5 | 0.12 |
| 1 | 0.5 | 0 | 60.0 | 10 | 8.0 | 1 | 56.8 | 0.14 |
| 1 | 0.6 | 0 | 66.0 | 13 | 32.0 | 10 | 62.6 | 0.17 |
| 1 | 0.7 | 0 | 74.0 | 17 | 50.0 | 19 | 71.0 | 0.19 |
| 1 | 0.8 | 0 | 80.0 | 20 | 60.0 | 27 | 76.6 | 0.19 |
| 1 | 0.9 | 0 | 86.0 | 23 | 70.0 | 34 | 82.1 | 0.20 |

**The chosen pair is floor 0, Clarify rounds 0.** The smallest floor with 0 silent errors is floor 0 for both values of N (60.0% to staff), so the rule takes the lower staff rate and then the smaller N.

The result says what this request set shows: **the floor is not needed here**. The Jev system has 0 silent errors at every floor, because the routing rules (Critical, Needs staff, risk, and the written rules) already send every unusable answer to support staff; a higher floor only adds staff load (60.0% -> 88.0% on dev) without removing an error. Clarify is therefore never used at the chosen parameters, and the floor charts are the evidence for the choice.

The **test** split confirms the shape: 0 silent errors at every floor, staff 52.0% at floor 0 and 94.0% at floor 0.9 (N = 0). With N = 1 the Clarify rate grows from 0.0% to 78.0% while the silent errors stay 0.

### The test split

The **test** split (50 requests per run, the Jev system):

| N | Floor | Silent errors | Staff % | Staff not needed | Clarify % | Unsure | Mean total s | API $/1k |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 52.0 | 6 | 0.0 | 0 | 49.5 | 0.13 |
| 0 | 0.2 | 0 | 52.0 | 6 | 0.0 | 0 | 49.5 | 0.13 |
| 0 | 0.5 | 0 | 54.0 | 7 | 0.0 | 1 | 51.2 | 0.13 |
| 0 | 0.6 | 0 | 64.0 | 12 | 0.0 | 13 | 59.6 | 0.11 |
| 0 | 0.7 | 0 | 76.0 | 18 | 0.0 | 21 | 69.9 | 0.09 |
| 0 | 0.8 | 0 | 86.0 | 23 | 0.0 | 31 | 78.5 | 0.07 |
| 0 | 0.9 | 0 | 94.0 | 27 | 0.0 | 39 | 85.3 | 0.06 |
| 1 | 0.5 | 0 | 52.0 | 6 | 2.0 | 0 | 49.7 | 0.14 |
| 1 | 0.6 | 0 | 60.0 | 10 | 26.0 | 8 | 57.6 | 0.15 |
| 1 | 0.7 | 0 | 68.0 | 14 | 42.0 | 15 | 65.4 | 0.18 |
| 1 | 0.8 | 0 | 74.0 | 17 | 62.0 | 24 | 71.5 | 0.20 |
| 1 | 0.9 | 0 | 82.0 | 21 | 78.0 | 33 | 80.0 | 0.22 |

(N = 1 with floors 0 and 0.2 is the same as N = 0: no answer is below 0.2, so nothing goes to Clarify.)

### The three rungs on the test split

| Rung | Staff % | Clarify % | Wrong | Harmful | Machine s | API $/1k | Total s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 Staff only | 100.0 | 0.0 | 0 | 0 | 0.0 | 0.00 | 90.0 |
| 1 LLM + rules | 0.0 | 0.0 | 23 | 0 | 14.2 | 0.87 | 14.2 |
| 2 Jev + LLM + rules + staff | 52.0 | 0.0 | 0 | 0 | 2.7 | 0.13 | 49.5 |

Rung 1 fails on 23 of the 50 requests: 20 requests whose correct result is Queued (no support staff help them) and 3 requests where the classifier answered "Send reply" for work that needs support staff. The written rules deny the 2 injection requests, so the orders in their text are ignored by the rules and not by the injection rule; no wrong state-changing action ran (harmful is 0). Rung 2 runs every request to a correct end: 52.0% of the requests go to support staff (6 of them go although the gold result does not need it), and the LLM writes the text with Jev's answer.

The sign test compares the two rungs on the same 50 requests: 23 discordant pairs, all of them a silent error at rung 1 only, 0 at rung 2 only (two-sided exact test, p = 2.4e-7).

Sending requests to support staff at random instead of routing them does not give the same result: from rung 1, escalating 26 of its 50 requests at random reaches the staff rate of rung 2 (52.0%) and leaves an expected 11.0 silent errors.

### The classifier stage on the test split

| Classifier stage | Jev | LLM |
| --- | ---: | ---: |
| Median latency (s) | 0.262 | 7.377 |
| 95th percentile (s) | 1.087 | 23.898 |
| Input tokens (per call) | 1191 | 963 |
| Output tokens (per call) | 188 | 832 |
| Cost per 1k requests ($) | 0.050 | 0.643 |

Per field, first pass, test split (share of the scored requests whose answer equals the gold answer):

| Field | Jev | LLM | n |
| --- | ---: | ---: | ---: |
| Queue | 95.8 | 95.8 | 48 |
| Action | 78.0 | 88.0 | 50 |
| Priority | 72.0 | 86.0 | 50 |
| Risk flag | 94.0 | 100.0 | 50 |
| Injection flag | 100.0 | 100.0 | 50 |
| Wrong in any field | 44.0 | 28.0 | 50 |
| Invalid answers | 0 | 0 | 50 |

Expected calibration error of Jev (test split), measured on the chance of the answer and on the confidence that Jev reports:

| Field | ECE, chance of the answer | ECE, reported confidence |
| --- | ---: | ---: |
| Queue | 0.049 | 0.050 |
| Action | 0.051 | 0.091 |
| Priority | 0.143 | 0.125 |
| Risk flag | 0.036 | 0.036 |
| Injection flag | 0.071 | 0.071 |

On the dev split the same comparison is Jev 56.0% wrong in any field against the LLM 20.0%, with action 76.0% against 88.0% and priority 84.0% against 90.0%.

### Evidence charts

- `figures/floor.pdf`: how the Jev system ended each request, per floor, on the test split.
- `figures/choose_floor.pdf`: silent errors, staff rate, and Clarify rate against the floor, on dev and on test.
- `figures/choose_rounds.pdf`: `N = 0` against `N = 1` for silent errors, staff rate, Clarify rate, and time.
- `figures/ladder.pdf`: the three rungs (wrong final results, machine and support staff time, API cost).
- `figures/classifier.pdf` and `figures/reliability.pdf`: accuracy per field and calibration of the two classifiers.

---

## The Neutrality Probe

`bun run experiment/neutrality.ts` makes **one** Jev call on a state that carries no request: the text is `N/A`, the state carries no help article, and the five questions are the five questions of Triage. The distributions are written to `results/neutrality.json`.

The answer of `jev-1.13.0` on this empty state (test evidence for the paper):

| Question | Answer | Distribution |
| --- | --- | --- |
| Queue | Product Help | Product Help 0.620, Account 0.310, Security 0.070, Payments 0.000, Refunds 0.000, Plans and Credits 0.000 |
| Action | Send reply | Send reply 0.690, Needs staff 0.310, Delete data 0.000, Start refund 0.000 |
| Priority | Low | Low 1.000, Medium 0.000, High 0.000, Critical 0.000 |
| Risk flag | false | false 0.850, true 0.150 |
| Injection flag | false | false 0.950, true 0.050 |

How to read it: the criteria do not remove the position of an option. On an input with no content the model prefers the first option of the action question ("Send reply") and the first option of the priority question ("Low", with probability 1.000), and it prefers the last option of the queue list ("Product Help"), whose tie-break order puts Product Help last. The two flags stay near "no" (0.85 and 0.95). The queue and priority priors are therefore a limit of the criteria, and the paper must report them; the probe does not test the option order, the option names, or the words that the criteria share with the request texts (see `not_checked` in the same file).

---

## What is NOT Simulated

1. **Support staff at rung 1**: rung 1 has no support staff at all, by design. A request that the written rules send to review, or that needs staff, is not helped, and the experiment counts that as a wrong final result.
2. **The Clarify dialogue**: the customer reply is the fixed `clarification` of the dataset, not live user input. The question itself comes from the LLM (`writeClarify`).
3. **Queued**: the ticket summary (`writeBrief`) is not written and no support staff reply is generated; the model assumes 90 s of support staff time per request that reaches Queued.
4. **Resolution Popup Delay**: the popup ("Did this solve your issue?") and the silence timers are chat behaviour. The experiment measures the first pass of one request, so no timer runs.
5. **A customer who writes again in the same chat**: not simulated. One request is one pass.
6. **The demo parameters**: `T`, the popup delay, and the "no, N times" limit of the demo are not measured here; the paper states this.
7. **The neutrality tests that need more calls**: the option-order test, the label-swap test, the cue-ablation test, the reader test, and the paraphrase test were not run; `results/neutrality.json` lists them as not checked.

---

## Honest Limitations

Where Jev is **not** better than the LLM baseline, on the test split:

* **Action accuracy**: the LLM answers 88.0% (44/50) of the actions correctly, Jev 78.0% (39/50).
* **Priority accuracy**: the LLM 86.0% (43/50), Jev 72.0% (36/50).
* **Risk flag accuracy**: the LLM 100.0% (50/50), Jev 94.0% (47/50).
* **The whole field**: Jev has at least one wrong scored field on 44.0% of the requests, the LLM on 28.0%.
* **Staff load**: the Jev system sends 52.0% of the requests to support staff; the LLM reference run (the same LLM with the rules of Triage and support staff) also has 0 silent errors and sends only 42.0%. On this request set the floor and Clarify do not lower the staff load: the routing rules decide the load, and Jev's wrong priority and action answers add 6 requests to the staff queue (5.2% of the split) that a correct classifier would keep.

Where Jev **is** better:

* **The whole rung**: rung 2 has 0 wrong final results against 23 at rung 1 (p = 2.4e-7), with 52.0% of the requests to support staff against none. The gain comes from the rules of Triage and the written rules; the classifier only has to be right about the fields that the rules read.
* **Classifier latency**: median 0.262 s against 7.377 s, and the 95th percentile 1.087 s against 23.898 s. The machine time of one request is 2.7 s in rung 2 against 14.2 s in rung 1.
* **Cost**: the classifier stage costs $0.050 per 1,000 requests with Jev against $0.643 with the LLM; the whole rung costs $0.13 against $0.87. Jev also writes a much shorter answer (188 output tokens per call against 832).
* **Calibration**: Jev reports a chance for every answer, and the expected calibration error of the chance of the answer is 0.049 (queue), 0.051 (action), 0.143 (priority), and 0.036 (risk flag). The LLM baseline reports no chance at all, so it can never be thresholded and never reaches Clarify. This is also what makes the floor unnecessary here: the chance is good enough that the routing rules, not a threshold, decide.

Other limits of this experiment:

* **Synthetic diversity**: the requests cover realistic domain edge cases (billing disputes, deletions, card fraud, prompt injections, teammate permissions, a mixed two-problem request), but they come from templated seeds, not from real customer text.
* **The Clarify reply** is the fixed `clarification` of the dataset, so the experiment does not measure the quality of a live dialogue. At the chosen parameters Clarify never runs, so this split measures the routing rules only.
* **Two failed calls**: the first attempt of the test sweep point (floor 0, rounds 0) lost 2 of its LLM calls to a closed socket from the provider. Both failures were written to `failures/` at the time, neither was cached, and both calls were made again (and recorded) by the later runs. The retry of `transport.ts` was added after that attempt and verified with a stub (two HTTP errors and then a success: three attempts, one record, one latency; empty text on every try: three attempts, one failure record, one error). The stale failure files of the superseded run were removed when that point was re-run; the incident is reported here because the evidence of that run no longer holds it.
* **The three rungs are not a controlled experiment on the classifier alone**: rung 2 changes the classifier, the routing rules, the floor, Clarify, and the staff queue together. The classifier-stage table (Jev against the LLM, same input, same criteria) is the controlled comparison.
* **The numbers come from cached answers**: every latency and token number is from the first live call of that request, and the offline replay reproduces them (verified).
