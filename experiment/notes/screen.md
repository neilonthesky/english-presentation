# The result screen of the Final message

Owner: ExpScreen. Target file: `experiment/screen.ts`, its data file `experiment/screen_handread.json`, and the chart
`screenChart` of `experiment/figures.ts`. Artifacts: `experiment/results/screen.json` (every answer, every flag,
every verdict of the hand-read) and `experiment/results/tables/screen.tex` (three ready-to-include tables). The script
never writes `results.json`, `per_case.json`, or the tables of the run; its calls are cached in
`results/requests/jev/` like the calls of the run.

**The set: 100 requests in 24 request types, the real run of the paper.** Every number below is read from
`results/screen.json`, and no number is an estimate.

```sh
bun run experiment/screen.ts    # 1st run on this set: 200 live Jev calls; every run since: 0 live calls, 200 cache hits
```

## Method

The experiment grades a "Send reply" by its action label only, so the text of the Final message is not scored: the
paper cannot say whether the reply promises a person, states the written rule that stopped the action, or claims a
change that never ran. The screen reads that text. The state of the call is the reply alone (`text` = the recorded
Final message, `help_articles` = "", channel = chat, `requester_type` = the role of the sender of that request), and
the questions are four Noul questions with written true and false criteria, one plain sentence each and no example
phrase taken from the dataset. One call asks all four questions about one reply, so the run makes **100 calls per
level** (200 in total), which are cached exactly like the calls of the run: a second run makes no live call. The
questions, the criteria and the state are written for this screen; they are not the criteria of Triage, and the paper
must not report calibration for them.

The four questions: (1) does the reply promise that a person, another team, or a callback will follow up;
(2) does the reply send the customer out of this chat for support; (3) does the reply state the written rule, limit,
role, or account fact that stopped (or prevents) the action; (4) does the reply claim a change of the account that no
state-changing action ran on that request.

## The flags, and the defects they are read against

Flags of the screen, and the same flags after the hand-read (below). Both levels: 100 replies judged, 0 failures,
0 unreadable answers.

| Question | Level 3 (Jev + LLM + rules) | Level 2 (LLM agent) |
| --- | ---: | ---: |
| Promises a person, a team, or a callback | 0 of 100 | 0 of 100 |
| Sends the customer out of this chat | 5 of 100 → **2** after the hand-read | 4 of 100 → **2** after the hand-read |
| States the rule, the limit, the role, or the account fact that stopped it | 56 of 100 (52 kept + 5 added) → **57** | 56 of 100 (52 kept + 3 added) → **55** |
| Claims a change of the account that did not run | 19 of 100 → **18** | 21 of 100 → **20** |

The defect view (a flag is only a candidate defect, read against the recorded flow):

| Defect | Level 3 | Level 2 |
| --- | ---: | ---: |
| Promises follow-up by a person, a team, or a callback (the prompt forbids it) | 0 | 0 |
| Sends the customer out of the chat (no channel, link, or contact outside the result and its help articles) | 2 (R0033, R0086) | 2 (R0004, R0009) |
| Claims a change that no state-changing action ran (raw: 1 candidate, cleared by the hand-read) | 0 | 0 |
| Says nothing ran and names no reason at all | 0 | 0 |

The reading of the replies that these flags are read against: a state-changing action ran on 18 of the 100 requests at
Level 3 and on 20 at Level 2, so 82 and 80 replies report that nothing ran, and a written rule denied the action on
22 and 36 of them. So at both levels the customer is told that the request was not acted on, and the replies state the
rule, the limit, the role, or the account fact that stopped it on 57 and 55 of the 100 replies (both figures after the
hand-read). The agent's flow denies the action by a rule more often than the classifier's (36 against 22), which is a
property of the two flows on this set; no reply in the set promises a person, and the 4 flags that survive the
hand-read are the same kind of defect (a reply that points outside the chat) at both levels.

## The hand-read (the agreement number is produced, not carried over)

The hand-read data lives in `experiment/screen_handread.json` and holds **800 verdicts**: every judged Final message
of both levels was read against all four questions (100 replies at Level 3 and 100 at Level 2), so this is a
complete read of both levels and not a sample (`scope` = "all" for each of the 8 level/question groups). Each verdict
records the request id, the level, the question, the verdict (a flag holds or it does not) and the reason in the terms
of the criterion.

* **800 verdicts, 23 disagreements with the screen (97.1 % agreement)**.
* The reader **clears 15 flags** and **adds 8**. The cleared ones: 5 outside-the-chat flags that name no place
  (R0050 at both levels, R0078, R0085, R0049 — the reader reads the reply as staying in the chat), 8 stop-reason
  flags on replies that claim a change or answer a question (R0016, R0056, R0058, R0091 at Level 3 and R0054, R0057,
  R0058, R0090 at Level 2), and the claims-change flag that the hand-read clears at both levels (R0050). The added
  ones are 5 stop-reason flags at Level 3 (R0017, R0025, R0026, R0028, R0092) and 3 at Level 2 (R0011, R0028,
  R0092): replies that do state a rule the screen had not flagged.
* The reader is the author of the criteria: a self-read of a screen, not an independent reader test. It is a
  published limitation, not a hidden one.

## What the screen shows, honestly

1. **No reply in the set promises a person, a team, or a callback** (0 of 100 at both levels, raw and after the
   hand-read), so the prompt rule that the Final message must not hand the customer over to a person holds on this
   set — for both levels, and it is the one property of the text that the outcome label could not tell us.
2. **The classifier level sends the customer out of the chat as often as the agent does** (2 of 100 at both levels
   after the hand-read), and those 4 replies name no place that the result or the help articles contain. This is a
   small, real defect of the text at both levels, and it is invisible in the outcome columns (all 4 requests are
   served or stopped as the gold asks).
3. **Both levels explain themselves at about the same rate.** After the hand-read the classifier level states the
   rule, the limit, the role, or the account fact that stopped the action on 57 of the 100 replies and the agent level
   on 55, although the agent's flow denies the action by a written rule more often (36 requests against 22). The
   screen question behind those numbers is the weakest one of the four: the reader overturned 8 of the flags the
   screen had kept and added 8 that it had missed (16 of the 23 disagreements of the whole hand-read), so the figure
   is a reading of two samples of text and not a property of the flow. The defect view is sharp where it matters: no
   reply of either level says nothing ran without giving a reason.
4. **The "claimed change that did not run" flag is the one that the hand-read takes to zero** (1 candidate at both
   levels, R0050, cleared): the reply of that request reports that the auto-renewal is already off, so the plan ends
   at its next renewal date with no further charge — a fact of the account and a prediction, not a claim that
   something ran. The 18 and 20 flags that stay at Level 3 and Level 2 are the correct claims of a change that ran
   (the recorded flow ran a state-changing action on 18 and 20 requests of the set), so they are not defects.

## Caveats

* The screen is a screen: a model reads the text and its flags are not ground truth. The hand-read says how far one
  reader agrees, and that reader is the author of the criteria. The agreement of 97.1 % is an agreement between a
  model and its author on 800 verdicts, not an inter-annotator agreement.
* A flag is not a defect on its own: the claim of a change is correct when the action ran (18 requests at each level
  of the 100-request set), and the same text is judged against the recorded flow.
* The screen reads the reply alone. It does not read the request, so a reply that gives a reason the reader cannot
  connect to the request is still read as a reason, and the reader's own knowledge of the request is used in the
  hand-read only.
* The questions, the criteria and the state are written for this screen and the paper must not report calibration for
  them.
* The calls of the screen do not go through the recording transport of the run (that transport validates every Jev
  answer against the five questions of Triage, and the questions of the screen are not those five). The screen writes
  and reads the same cache records, so its calls are cached with the calls of the run.

## Ready to paste: `experiment/README.md`

> ### The result screen of the reply text
>
> The outcome of the run reads the action label of the answer, not the text that the customer reads, so a separate
> screen reads the Final message of all 100 requests with four Jev Noul questions (one call per reply, 200 calls,
> cached): does it promise a person, send the customer out of the chat, state the rule that stopped the action, or
> claim a change that did not run. Every judged reply of both levels was then read by hand against all four questions
> (800 verdicts, the data is in `screen_handread.json`), which agrees with the screen on 97.1 % of the verdicts and
> clears 15 flags while adding 8. The result: **no reply of the 100 requests promises a person, a team, or a
> callback** at either level; 2 replies of each level send the customer out of the chat naming no place that the
> result or its help articles contain (a real, small defect of the text); the reply states the rule, the limit or the
> account fact that stopped it on 57 of the 100 classifier-level replies and 55 of the 100 agent replies (after the
> hand-read), although the agent flow denies the action by a written rule more often than the classifier flow does
> (36 requests against 22), and the 18 and 20 claims of a change are all claims of a change that ran, so none of them
> is a defect. The screen costs one Jev call per request and a rerun is free from the cache.

## Ready to paste: paper paragraph

> **Reading the reply.** The outcome of the flow grades the action, not the text that the customer reads, so we read
> that text with four written questions (one model call per reply, 100 replies per level): does the reply promise a
> person, another team, or a callback; does it send the customer out of the chat; does it state the rule, the limit,
> the role, or the account fact that stopped the action; and does it claim a change that no action ran. We then read
> every judged reply of both levels by hand against the same four criteria (800 verdicts, one reader, the author of
> the criteria), which agrees with the screen on 97.1 % of the verdicts (15 flags cleared, 8 added). No reply of the
> 100 requests promises a follow-up by a person at either level, and 2 replies per level send the customer out of the
> chat without naming a place that the result or its help articles contain: the prompt rule that the reply must stay
> in the chat holds, with that small exception, at both levels. The replies state the rule, the limit, the role, or
> the account fact that stopped the action on 57 of the 100 replies of the classifier level and on 55 of the 100
> replies of the agent level, and we report the weakness of that screen question rather than hide it: the hand-read
> overturned 8 of those flags and raised 8 that the screen had missed (23 disagreements in 800 verdicts), so the
> figure is a reading of the text and not a property of the flow. The claims of a change (18 and 20)
> are all claims of a change that ran, so the screen finds no false promise of a completed change on this set.

## Repro

```sh
cd <repo>
bun run experiment/screen.ts    # 200 Jev calls on the first run, 0 on every run after (cache), writes results/screen.json
bun run experiment/screen.ts    # the hand-read agreement is recomputed from screen_handread.json, so it never changes silently
```
