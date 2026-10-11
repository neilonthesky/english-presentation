# The confidence cascade over the recorded answers (offline, zero model calls)

Owner: ExpCascade. Target file: `experiment/cascade.ts`, one chart in `experiment/figures.ts` (`cascadeChart`).
Artifacts: `experiment/results/cascade.json` (every number, both gates, every threshold),
`experiment/results/tables/cascade.tex` (five ready-to-include tables), `experiment/results/figures/cascade.svg` and
`cascade.pdf` (three panels). No model call is made and the network is never touched: the script reads
`experiment/results/per_case.json` and nothing else, and `results.json`, `per_case.json`, and the cache of the run are
never written.

**The set: 100 requests in 24 request types, the real run of the paper** (`results/per_case.json`, 100 records per
level). Every number below is that run, and no number is an estimate or a projection.

```sh
bun run experiment/cascade.ts          # writes the three artifacts and prints the whole curve
bun run experiment/cascade.ts <dir>    # reads <dir>/per_case.json, writes into <dir>
```

`cascade.ts` takes a directory argument and nothing else; it has no `--offline` flag because it is offline by
construction.

## Method

Jev answers first. A request goes to the next stage when the chance that gates it is **below** the threshold.
Two gates (the chance fields are the ones that the fixed code of Level 3 reads):

* `action`: the chance of the action answer;
* `decision`: the lowest chance among action, topic (the Security rule reads it) and injection flag (the rule of
  Triage reads it). An invalid answer counts as chance 0, so it always escalates.

Two next stages: `llm` (the reference LLM classifier run, whose recorded flow of that request then runs, so outcome,
time and cost are recorded values) and `staff` (the Level 1 assumption: 90 s, no error, no API cost; the Jev call
that gates the request is still paid for).

Three views, all over the same 100 paired records:

1. **Outcome** — served, stopped, errors, harmful, machine seconds, API $/1k. A request handled by staff is reported
   in its own column `staffHandled` and is **not** folded into `served`. Every row satisfies
   `served + stopped + errors + staffHandled = 100` (asserted in code).
2. **Label quality** — the action-label accuracy and the all-field correctness of the answer of the machine stage
   that finally answered (label of Jev when its gate chance is at or above the threshold, label of the LLM
   otherwise), plus the coverage (share answered by Jev alone) and the same numbers split per stage.
3. **Jev alone with abstention** — the risk-coverage curve (action-label error rate of the answered requests against
   the coverage) computed at every distinct chance value, its area (AURC), and the precision/recall of
   "escalate when the action label is wrong".

Thresholds: 0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99 and 1.0000001 (> 1 escalates everything). 0 and > 1 are the two
ends of the curve. No threshold is picked as a winner: the requests that fix the curve are the same that measure it.

## 1. Outcome: the cascade changes nothing until it is no longer a cascade

Decision gate, next stage the LLM. `To LLM` = escalated.

| Threshold | To LLM | Served | Stopped | Errors | Harmful | Machine s | API $/1k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Jev alone / < 0.5 | 0 | 70 | 30 | 0 | 0 | 4.19 | 0.279 |
| < 0.6 | 13 | 70 | 30 | 0 | 0 | 5.74 | 0.389 |
| < 0.7 | 24 | 70 | 30 | 0 | 0 | 6.80 | 0.465 |
| < 0.8 | 35 | 70 | 30 | 0 | 0 | 7.58 | 0.521 |
| < 0.9 | 59 | 70 | 30 | 0 | 0 | 9.89 | 0.681 |
| < 0.95 | 77 | 70 | 30 | 0 | 0 | 10.95 | 0.757 |
| < 0.99 / All to LLM | 100 | 69 | 30 | 1 | 0 | 12.49 | 0.865 |
| LLM alone (no Jev gate) | 100 | 69 | 30 | 1 | 0 | 12.15 | 0.813 |

The reason is a single request, not a general law: the recorded outcome of the LLM reference run differs from the
recorded outcome of Jev on exactly **1 of the 100 requests** (R0097: Jev serves it, the LLM answers with an invalid
action label and the flow ends in an error). That request carries a decision chance of 0.96, so every threshold up to
0.95 leaves it with Jev, and the outcome columns are identical from 0 to 0.95 while the machine time goes 4.19 s →
10.95 s and the cost 0.279 → 0.757 $/1k. The only threshold that changes the outcome is 0.99, which sends all 100
requests to the LLM and therefore turns the 0 errors of Level 3 into 1. The action gate is the same picture
(it escalates 0, 0, 3, 7, 10, 19, 34, 52, 100): 0 errors at every threshold up to 0.95 and 1 error at 0.99.

Staff as the next stage (decision gate): the outcome columns cover only the machine-handled requests, and the staff
requests appear in `Staff`:

| Threshold | To staff | Served | Stopped | Errors | Staff | Machine s | Mean total s | API $/1k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Jev alone / < 0.5 | 0 | 70 | 30 | 0 | 0 | 4.19 | 4.19 | 0.279 |
| < 0.6 | 13 | 63 | 24 | 0 | 13 | 3.67 | 15.37 | 0.247 |
| < 0.8 | 35 | 48 | 17 | 0 | 35 | 2.90 | 34.40 | 0.199 |
| < 0.95 | 77 | 22 | 1 | 0 | 77 | 1.19 | 70.49 | 0.097 |
| All to staff | 100 | 0 | 0 | 0 | 100 | 0.33 | 90.33 | 0.052 |

Each row adds up to 100. The staff column is the honest way to read the Level 1 assumption: the study assumes that
staff make no error, so a staff request must never be counted as a machine `served`.

Sanity check: the two ends of the table reproduce `systems.jev` (70 / 30 / 0, 4.190 s, $0.279) and `systems.llm`
(69 / 30 / 1, 12.154 s, $0.813) of `results.json`.

## 2. Label quality: the cascade does buy labels, and the outcome cannot see them

Label quality of the cascade to the LLM. `Coverage` = share answered by Jev alone. `Action`, `All fields` = share
of the 100 answers correct.

| Threshold | Action gate: coverage / action / all | Decision gate: coverage / action / all |
| --- | --- | --- |
| Jev alone / < 0.5 | 100 / 84.0 / 39.0 | 100 / 84.0 / 39.0 |
| < 0.6 | 97 / 85.0 / 39.0 | 87 / 86.0 / 39.0 |
| < 0.7 | 93 / 85.0 / 40.0 | 76 / 87.0 / 41.0 |
| < 0.8 | 90 / 85.0 / 41.0 | 65 / 88.0 / 46.0 |
| < 0.9 | 81 / 89.0 / 44.0 | 41 / 93.0 / 57.0 |
| < 0.95 | 66 / 93.0 / 49.0 | 23 / 94.0 / 61.0 |
| < 0.99 | 48 / 93.0 / 56.0 | 0 / 93.0 / 65.0 |
| LLM alone | 0 / 93.0 / 65.0 | 0 / 93.0 / 65.0 |

Jev alone: 84.0 % action, 39.0 % all fields (84/100, 39/100). LLM alone: 93.0 % / 65.0 % (93/100, 65/100).

Read it honestly. The cascade to the LLM does improve the labels, and it improves them from the first escalation: on
the decision gate the action accuracy goes 84.0 % at full coverage, 86.0 % at 87 % coverage, 88.0 % at 65 %,
93.0 % at 41 %, and the all-field accuracy 39.0 % → 46.0 % → 57.0 % → 61.0 % → 65.0 %. The single dip is one
request on the decision gate at threshold 0.5 (coverage 97.0 %, all-field accuracy 39.0 % → 38.0 %). The direction is
the one the LLM's own accuracy predicts (93 % against 84 %): the requests that Jev is least sure about are the ones
where its label is most often wrong, so handing them to a better labeller improves the mixed label.

What the label gain does **not** do is reach the customer. Between coverage 100 % and coverage 23 % (which is
77 of 100 requests escalated, 10.95 s and $0.757 per 1,000 requests) the outcome columns never move: 70 served,
30 stopped, 0 errors, because the fixed rules of Level 3 absorb the classifier mistakes and the single differing
request sits at decision chance 0.96. The label improvement is therefore real and invisible in the outcome: a
cascade justified by "the labels get better" is paying 2.6× the time and 2.7× the cost of Jev alone for a number
that the customer never sees, and the only threshold that reaches the outcome (0.99) makes the outcome **worse**.

## 3. Jev alone with abstention: the errors are the confident ones

Risk-coverage, action answer, over the 27 distinct chance values (each cut is a chance value):

* AURC = 0.043 (the area under the risk-coverage curve; lower is better, 0 would be a perfect selective classifier).
* Action-label error rate of the answered requests: 16.0 % at full coverage; 16.7 % at coverage 90 % (**higher** than
  at full coverage); 6.9 % at coverage 72 %; 2.1 % at coverage 48 %.
* Coverage 41 % is the price of a zero-error answer: the highest chance among the 16 wrong action labels is 0.99, so a
  zero-error answer has to abstain on every request whose chance is below 1.0, which leaves 41 % of the traffic.
* 8 of the 16 Jev action errors carry a chance of at least 0.9 (the 16 error chances are 0.56, 0.80, 0.81, 0.83,
  0.86, 0.88, 0.89, 0.89, 0.91, 0.91, 0.92, 0.93, 0.93, 0.94, 0.96, 0.99).

Escalate-when-wrong view (precision = how many escalated requests really are wrong; recall = how many of the 16
errors are escalated):

| Threshold | Action gate: escalated (wrong/correct) | Precision | Recall | Decision gate: escalated | Precision | Recall |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| < 0.6 | 3 (1/2) | 33.3 % | 6.3 % | 13 (2/11) | 15.4 % | 12.5 % |
| < 0.8 | 10 (1/9) | 10.0 % | 6.3 % | 35 (5/30) | 14.3 % | 31.3 % |
| < 0.9 | 19 (8/11) | 42.1 % | 50.0 % | 59 (13/46) | 22.0 % | 81.3 % |
| < 0.95 | 34 (14/20) | 41.2 % | 87.5 % | 77 (15/62) | 19.5 % | 93.8 % |
| < 0.99 | 52 (15/37) | 28.8 % | 93.8 % | 100 (16/84) | 16.0 % | 100 % |
| All to LLM | 100 (16/84) | 16.0 % | 100 % | 100 (16/84) | 16.0 % | 100 % |

The best point of the whole curve is the action gate at 0.9: to catch 8 of the 16 errors it escalates 19 requests,
of which 11 are correct (precision 42.1 %). Escalating everything has precision 16.0 %, which is exactly the chance
level (16 errors in 100 requests). The decision gate is dominated: for 13 caught errors it escalates 59 requests
against 19 for 8 caught on the action gate. The gate field that carries the signal is the action chance, and even it
is weak, because half of the errors sit at chance ≥ 0.9.

## 4. Verdict: not worth it on this data

* **On the outcome, the cascade is a pure cost.** Served/stopped/errors are 70/30/0 at every threshold on both gates
  up to 0.95, because the LLM reference run differs from Jev on 1 of the 100 requests and that request is escalated
  only at 0.99. Escalating 77 of 100 requests buys 4.19 s → 10.95 s and 0.279 → 0.757 $/1k and nothing else, and the
  one threshold that changes the outcome makes it worse (1 error where Jev made none). With staff as the next stage
  the machine outcome improves by construction, but the customer waits 90 s: `mean total s` goes 4.19 → 15.37 →
  34.40 → 70.49 → 90.33 s.
* **On label quality, the cascade pays, but the paper must not sell the label.** The mixed label improves from the
  first escalation on the decision gate (84 % → 86 % → 88 % → 93 % action; 39 % → 46 % → 57 % → 65 % all fields),
  which is what the LLM's own 93 % / 65 % predicts, and it costs the traffic that the escalation sends away. The
  outcome view cannot see any of it. So the honest reading is not "the cascade hurts the labels" (it does not) but
  "the cascade improves a number the flow does not use".
* **Selective abstention cannot find the errors.** AURC 0.043 looks small, but a small AURC here means the risk is
  flat: 16.0 % error at full coverage against 16.7 % at 90 % coverage and 2.1 % at 48 % coverage. Half of the errors
  are confident (8 of 16 at chance ≥ 0.9), so the low-chance tail is where the fallback is least needed.
* **What would have to be true for it to pay**: the classifier errors must be both concentrated at low chance and
  visible in the outcome. Here they are neither: 8 of 16 are confident, and the fixed rules of Level 3 already catch
  the outcome-moving mistakes, so the cascade has almost nothing left to fix. The paper should report the curve as a
  negative result on 100 requests, not a tuned threshold.

## Caveats

* **100 requests, evaluated in sample.** The thresholds are read from the same 100 requests that measure them, so no
  threshold is a tuned winner; the whole curve is reported and the ends (Jev alone, LLM alone) are the two systems as
  they were recorded. With 16 action errors in 100 requests the precision/recall points are coarse.
* **The 1-request difference drives the outcome view.** The outcome columns of the cascade are identical to Jev alone
  because the two recorded systems disagree on one request (R0097). That is a property of this set, not a promise
  that a cascade cannot move an outcome.
* **The label grade is the gold label of the dataset**, not the outcome of the flow. It is reported next to, not
  instead of, the outcome counts; the action accuracy of 84 % / 93 % matches the classifier table of the paper.
* **The staff stage is an assumption** (90 s, no error, no API cost), so its outcome columns are never mixed into
  `served`. The Jev call that gates a staff request is still paid for.
* **The recorded LLM answers were produced on the whole 100-request run**, not on the subset the cascade would have
  sent it; the cascade re-uses them, so it measures the recorded answers, not a fresh sub-run.

## Ready-to-paste paragraph (English, no request ids, no paths)

> **The confidence cascade (offline, 100 requests).** To test whether a cheap classifier can gate a stronger one, we
> replayed the recorded answers of the 100 requests offline and escalated a request to the LLM reference run whenever
> the chance of the classifier fell below a threshold, over two gates (the action chance, and the lowest chance among
> the fields that the fixed code reads: action, topic, injection). On the outcome the cascade is a pure cost: served,
> stopped and errors stay at 70, 30 and 0 for every threshold up to 0.95 — 77 of the 100 requests escalated — because
> the two recorded systems disagree on a single request, which is escalated only at 0.99 — while the machine time
> rises from 4.19 s to 10.95 s and the cost from $0.28 to $0.76 per 1,000 requests; the one threshold that reaches
> the outcome sends every request to the LLM and turns the 0 errors of the classifier level into 1. The label view is
> the real test and it is positive but unobservable: escalating the lowest-chance requests first raises the action
> accuracy from 84.0 % to 86.0 % at 87 % coverage, 88.0 % at 65 % and 93.0 % at 41 %, and the all-field accuracy from
> 39.0 % to 65.0 %, exactly as the reference run's own 93.0 % / 65.0 % predicts; the flow, however, never uses the
> label, and the fixed rules already absorb the mistakes that would change the outcome. Selective abstention cannot
> find the errors either: half of the 16 wrong action labels carry a chance of at least 0.9, and the best escalation
> point catches 8 of the 16 errors while needlessly escalating 11 correct requests (precision 42.1 %, chance level
> 16.0 %). The thresholds are read from the same 100 requests that measure them, so the paper reports the whole curve
> and no tuned threshold: on this data the fixed rules, not a confidence cascade, are what keeps the mistakes out of
> the outcome.

## Repro

```sh
cd <repo>
bun run experiment/cascade.ts    # writes results/cascade.json, results/tables/cascade.tex, results/figures/cascade.svg and cascade.pdf
bun run experiment/cascade.ts    # same numbers: the analysis is offline and deterministic
```
