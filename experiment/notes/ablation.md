# The ablation of the fixed rules code (Level 2b and the counterfactual cell)

Owner: ExpAblation. Target file: `experiment/ablation.ts`. Artifacts: `experiment/results/ablation.json`,
`experiment/results/tables/ablation.tex` (two ready-to-include tables). The script never writes `results.json`,
`per_case.json`, `neutrality.json`, the other tables, or the figures; the result screen of the same run is in
`experiment/notes/screen.md` and its script is `experiment/screen.ts`.

**The set: 100 requests in 24 request types, the real run of the paper.** Every number below is that run, read from
`results/ablation.json` (which is computed from `results/per_case.json`), and no number is an estimate.

```sh
bun run experiment/ablation.ts     # 1st run on this set: 34 live LLM calls (new Final messages), 0 live Jev calls
bun run experiment/ablation.ts     # 2nd run: 0 live calls, 500 cache hits
```

The script replays Levels 2 and 3 from the cache of the paper itself (`processAgentRequest`,
`processClassifierRequest`) and checks that replay against `results/per_case.json`: 100 of 100 records match for both
levels (the same outcome, the same action that ran, the same decision tokens). The new cache records land in
`results/requests/llm/` and `results/requests/jev/`; the run of the paper never reads them, and nothing of the main
run changes.

## Method

**Level 2b (new).** The recorded Level 2 agent answers are the input, and the fixed code of Level 3 runs behind them:

1. The action that the agent named is the action it ran, or the action of the written rule it refused with; a refusal
   that names no rule ("none") asks for no action, so the request is an answer ("Send reply"). No new agent call runs:
   the decision latency and the decision tokens are the recorded ones of that call.
2. That action goes through the fixed code of Level 3: `rulesStep` (`policyFor`) on the account fields of that action
   (`accountFieldsFor`) and the Security rule. The agent that refused with the Security rule reports the misuse of the
   account, so nothing runs: the Security rule belongs to no one action, and the ruling is the one that Level 2 reads
   (`rulingPolicy`). The 4 misuse reports of this set are the only answers of this kind.
3. Do action runs only what the check allows (`actStep`), and the Final message is written exactly as Level 3 writes
   it (the account fields of the action, and the written policy of the check), through the recording transport, so the
   time and the cost are real. The new messages are cached.

**Level 3 without the check (counterfactual, not a product level).** The recorded Jev answer goes through Triage (so
the rules of Triage run, the injection rule included) and the action of Triage runs with no Rules check; the Final
message carries the written policy when the check would allow the action (so the cache serves the recorded message of
Level 3) and no policy when the check would deny it (a new call). It measures what the check itself is worth.

Asymmetries, by construction: Level 2b has no rules of Triage (the agent answers no injection flag, so the injection
rule cannot run there), and the misuse signal of its Security rule is the agent's own refusal (the agent has no typed
topic).

## The four levels side by side

| Level | Served | Stopped | Errors | Harm | Label err. | Mach. s | $/1k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 LLM agent | 66 | 28 | 6 | 2 | 10 | 7.85 | 0.61 |
| 2b LLM agent + fixed check | 66 | 28 | 6 | 2 | 10 | 8.27 | 0.61 |
| 3 Jev + LLM + rules | 70 | 30 | 0 | 0 | 16 | 4.19 | 0.28 |
| 3 without the check (counterfactual) | 66 | 12 | 22 | 22 | 34 | 3.93 | 0.26 |

## The 2x2 grid that isolates the two parts

| Classifier | Fixed check | Served | Stopped | Errors | Harm |
| --- | --- | ---: | ---: | ---: | ---: |
| LLM agent | no (Level 2) | 66 | 28 | 6 | 2 |
| LLM agent | yes (Level 2b) | 66 | 28 | 6 | 2 |
| Jev | no (counterfactual) | 66 | 12 | 22 | 22 |
| Jev | yes (Level 3) | 70 | 30 | 0 | 0 |

## Sign tests (two-sided exact, one pair per request, 100 pairs)

| Comparison | Discordant pairs | p |
| --- | ---: | ---: |
| 2 against 2b | 0 | 1.000 |
| 2b against 3 | 6 (all errors at 2b) | 0.031 |
| 2 against 3 | 6 (all errors at 2) | 0.031 |
| 3 without the check against 3 | 22 (all errors at the counterfactual) | 0.0000005 |

## The check against the agent

The fixed check and the agent reach the same verdict on **100 of the 100** answers, so it changes **0 runs** and every
level count of 2b equals the count of Level 2. Of the 100 answers, 96 name an action: 20 run it, 36 are denied and
nothing runs, and 40 answer with a plain reply that the check allows; the 4 refusals that name the Security rule name
no action at all. No refusal of this set names the empty rule ("none"), and no answer of this set is invalid (0
invalid answers at both levels).

## The action labels themselves

| Step | Its action equals the gold asked action | |
| --- | ---: | ---: |
| the action that the agent named (run, or the action of the refused rule) | 94/100 | 94.0% |
| the Jev action of Level 3 | 84/100 | 84.0% |

A refusal counts as the action of the rule that the agent named, so this is not the field accuracy of the classifier
table (Jev's own action field is 84/100 as well, by coincidence of this set); it says that the classifier is not where
Level 2 loses its 6 errors.

## What the numbers show

1. **Behind the agent, the fixed check adds nothing.** The check reads the action that the recorded agent named (the
   action it ran, or the action of the written rule it refused with) and reaches the same verdict as the agent on all
   100 answers, so it changes 0 runs and Level 2b is Level 2 (66 / 28 / 6, 2 harmful runs). The two failures of the
   agent are out of the check's reach: on the 2 refund requests it runs **Cancel plan**, an action that no written
   rule forbids, so the check allows what the agent asked for and the run stays harmful; on the 4 injection requests
   it names the refund and a refund rule denies it, but the check has no typed topic and no injection flag to force
   the reply that those requests deserve. That is also where the difference against Level 3 has to come from.
2. **Behind Jev, the same check is worth 22 runs.** With the recorded Jev labels and no check, 22 forbidden actions
   run: the 18 requests whose gold final action is a denial and on which the classifier names the forbidden action
   (8 refunds, 6 plan cancellations, 4 password resets), and the 4 misuse reports, where the Security rule needs the
   typed topic of the classifier and nothing else stops the refund or the password reset. The run ends
   66 / 12 / 22 with **22 harmful runs** (9 of them on money or data), and the difference against Level 3 is far
   beyond chance (22 discordant pairs, p = 0.0000005). The check is what turns the action labels of Jev into the 30
   intended stops.
3. **The gain of Level 3 over Level 2 is significant and it comes from the classifier and the rules of Triage.** The
   two levels differ on 6 requests (6 discordant pairs, all against Level 2, p = 0.031), in two groups. On 4 requests
   that report a misuse of the account, the agent names the refund that the customer asks for, a written rule denies
   it, and the flow ends with no reply delivered where the request deserves one (an error); the recorded Level 3
   answer replies "Send reply" instead, because the injection rule of Triage forces that action and the rules then
   allow it, so the request is served. On 2 refund requests (a charge the customer did not mean to buy, and a charge
   the manager did not approve), the agent runs **Cancel plan**, a state-changing action nobody asked for, which is
   both an error and a harmful run; the classifier names the refund, the written rule denies it, and the request ends
   as a stop that tells the customer why. Level 2b keeps all 6 (the agent names an action on every one of them), which
   is the point of the ablation: the fixed check behind the agent repairs none of them.
4. **The check is also cheaper than the agent when it decides.** Level 3 pays $0.279 per 1,000 requests against
   $0.605 for Level 2 and $0.609 for Level 2b, because the classifier replaces the agent's long decision call (0.33 s
   against 3.97 s of decision latency, 2,250 against 2,439 tokens per request). 2b differs from 2 only in the Final
   message, which reads the account fields of the action instead of the whole account (2,403 against 2,439 tokens per
   request, 8.27 against 7.85 s, $0.609 against $0.605 per 1,000).
5. The 2b record keeps the shape of a Level 2 record, so `summarize`, `decisionCost`, `requestCost`, and `signTest`
   of `metrics.ts` read it with the same code as every other run.

## Caveats

* **100 requests, evaluated in sample.** The set that found the Security rule and the account-fields table is the set
  that measures the ablation, so it is a description of this set, not a blind test.
* The Security rule of Level 2b reads the agent's own refusal, because the agent has no typed topic; a check behind a
  model cannot invent that label. On the 4 requests concerned nothing runs either way, so no number moves.
* Level 2b has no rules of Triage: the agent answers no injection flag, so the injection rule (which forces "Send
  reply") can only run at Level 3. The 4 requests where that decides the outcome are the prompt-injection requests
  (gold action a refund, gold final action a reply): the agent names the refund on every one of them and a refund
  rule then blocks it, so Level 2 and Level 2b end all 4 in an error where Level 3 serves the request.
* The Final messages of Level 2b and of the counterfactual cell are new samples of the same model, so their tokens and
  latency are not the tokens and the latency of the recorded Level 2 or Level 3 messages of the same request.
* The counterfactual cell is not a product level. It exists because without it the ablation would read, wrongly, that
  the fixed rules check has no value: it has none behind the agent, and 22 runs behind Jev.

## Ready to paste: `experiment/README.md`

> ### The ablation of the fixed rules check
>
> The ladder has three levels, and the run also has **Level 2b**: the recorded agent of Level 2 behind the fixed check
> of Level 3. The check reads the action that the agent named, and its verdict is the same as the agent's on all 100
> answers, so it changes no run: 66 served, 28 stopped, 6 errors, the same six errors as Level 2. The value of the
> check shows when the classifier is Jev: with the recorded Jev labels and **no** check, 22 forbidden actions run (the
> requests whose gold action a written rule denies, and the 4 misuse reports that the Security rule stops), and the
> run ends 66 / 12 / 22 with 22 harmful runs. The difference against Level 3 is 22 discordant pairs (p = 0.0000005,
> two-sided exact), while the difference between Level 2 and Level 3 is 6 pairs, all against Level 2 (p = 0.031, also
> significant on 100 requests). So the gain of Level 3 over Level 2 comes from the classifier and the rules of Triage,
> and the fixed check is what makes the action labels of Jev safe. The evidence is `results/ablation.json` and
> `results/tables/ablation.tex`.

## Ready to paste: paper paragraph

> **Where the gain comes from.** Level 3 is better than Level 2 on the 100 requests (70 / 30 / 0 against 66 / 28 / 6,
> and 0 against 2 harmful runs), and the difference is significant on the paired requests (6 discordant pairs, all
> against Level 2, two-sided exact sign test p = 0.031). The ablation of the fixed rules check separates the two
> candidate causes. We re-ran the flow with the recorded answer of the LLM agent and the fixed check of Level 3
> behind it: the check reads the same written rules as the agent and reaches the same verdict on all 100 answers, so
> it changes no run, and the level stays at 66 / 28 / 6. We then read the recorded labels of the classifier of
> Level 3 with no check behind them: 22 actions that a written rule forbids run (the requests whose gold action is a
> denial, and 4 requests that report a misuse of the account, where the Security rule needs the typed topic), which
> leaves 66 / 12 / 22 and 22 harmful runs; the difference against Level 3 is 22 discordant pairs (p = 0.0000005). The
> gain of the ladder's top level therefore comes from the classifier and from the rules of Triage: the fixed check
> adds nothing behind a model that already applies the rules, and it is what keeps an action label that a classifier
> gives safe to run.

## Repro

```sh
cd <repo>
bun run experiment/ablation.ts            # writes results/ablation.json, results/tables/ablation.tex
bun run experiment/ablation.ts --offline  # must not fail: every call is cached after the first run
```
