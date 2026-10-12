# The robustness probes of the classifier criteria

Owner: ExpRobust. Target file: `experiment/robustness.ts`. Artifacts: `experiment/results/robustness.json` (every
probe, every answer, every count), `experiment/results/tables/robustness.tex` (four ready-to-include tables), and the
cache in `experiment/results/robustness_cache/`. The script never writes `results.json`, `per_case.json`, or
`results/requests/`, and it never touches the questions of the paper (`JEV_QUESTIONS` of
`system/models.ts`): every probe builds its own copy of the criteria, and the recorded answer of the run is
always the comparator.

**The set: 100 requests in 24 request types, the real run of the paper.** Every probe runs on all 100 requests of the
experiment (the same set as `results/per_case.json`), and every number below is read from `results/robustness.json`.
No number is an estimate and none is carried over from the earlier 50-request run.

```sh
bun run experiment/robustness.ts            # 1st run on this set: 500 live Jev calls + 100 live paraphrase calls
bun run experiment/robustness.ts            # 2nd run: 0 live calls, 600 cache hits, identical numbers
```

The four probes and their cost are printed by the script as well:

* Jev: 500 calls, 623,233 input tokens, 98,623 output tokens → **$0.0262** at list price.
* Paraphrase (the cheap LLM, one call per request): 100 calls → **$0.0275**.
* **Total $0.0537** for the whole file, at list price on every token of the recorded calls. The first run on this set
  made all 500 Jev calls and all 100 paraphrase calls live (600 live calls, nothing in the cache yet); every run since
  makes no live call and costs nothing.

The recorded run is the comparator everywhere: topic (queue) 84/96 = 87.5 %, action 84/100 = 84.0 %, priority
81/100 = 81.0 %, risk 77/100 = 77.0 %, injection 96/100 = 96.0 %.

## A. Option order (the option lists reversed, then shuffled)

The option lists of the three option-list questions (topic, action, priority) are reversed, and shuffled with the
fixed seed 20261008, while every criteria sentence stays glued to its own option. A changed answer is a property of
the criteria on this input, not an error of the system under test.

| Probe | Changed answers (per field) | Requests with a change | Topic | Action | Priority |
| --- | --- | ---: | ---: | ---: | ---: |
| Recorded | — | — | 87.5 % | 84.0 % | 81.0 % |
| Reversed | risk 1, priority 7, queue 2, injection 1, action 1 | 12 | 89.6 % (86/96) | 83.0 % (83/100) | 88.0 % (88/100) |
| Shuffled | risk 1, queue 4, priority 7, injection 1, action 0 | 13 | 84.4 % (81/96) | 84.0 % (84/100) | 88.0 % (88/100) |

The change goes into the answer text of the whole call, so the two flag questions move as well (1 risk answer and 1
injection answer in each ordering) although no option list of theirs changed.

## B. Label swap (the options renamed to neutral codes)

The five options of the action question were renamed to the codes A, B, C, D, E (in the order of the original option
list: A = Send reply, B = Start refund, C = Delete data, D = Cancel plan, E = Reset password) while every criteria
sentence was kept, so the definition of an option did not change and only the name it carries did.

* **0 of 100 action answers changed**; the action accuracy is 84/100 = 84.0 %, exactly the recorded accuracy.
* The codes chosen: A 56, B 17, E 15, D 12, C 0. No code was unknown and no answer was unreadable.
* The model never chose "Delete data" on this set, either in the recorded run or under the neutral names, which is
  worth saying out loud: the answer is not an artifact of the letters.

## C. Paraphrase (the wording of the request rewritten)

Every request text was rewritten by the cheap LLM (`deepseek/deepseek-v4.1-flash`, temperature 0) with the instruction
to keep every fact (amounts, dates, e-mail addresses, names, numbers) and to add and remove nothing. The five
questions of Triage were asked again on the state of the paraphrase (`classifierState`), so the help articles are the
ones of the paraphrased text. This is the only probe that moves many answers:

| Field | Changed answers | Agreement with the recorded answer | Accuracy on the paraphrase | Recorded accuracy |
| --- | ---: | ---: | ---: | ---: |
| Risk flag | 3 | 97/100 (97.0 %) | 78/100 (78.0 %) | 77/100 (77.0 %) |
| Priority | 10 | 90/100 (90.0 %) | 84/100 (84.0 %) | 81/100 (81.0 %) |
| Injection flag | 3 | 97/100 (97.0 %) | 95/100 (95.0 %) | 96/100 (96.0 %) |
| Action | 3 | 97/100 (97.0 %) | 87/100 (87.0 %) | 84/100 (84.0 %) |
| Topic | 5 | 95/96 (99.0 % of the 96 scored) | 80/96 (83.3 %) | 84/96 (87.5 %) |

20 of the 100 requests have at least one changed field, and the priority answers are the least stable (10 of 100, the
larger half of the movement). The fact check: only **5** of the 100 texts carry a fact at all (the e-mail addresses of
R0071 to R0074 and the day count of R0007) and **5 of 5 are preserved**; the other 95 describe the problem in words,
because the numbers live in the account of the world file. The check is mechanical (it looks for the same string), so
it is a lower bound: a fact expressed in other words would count as missing, and none did here.

Tokens of the paraphrase calls: 17,659 input, 41,402 output (recorded; the answers are cached).

## D. The abstention option (an experimental copy of the topic and action questions)

An experimental copy of the topic and the action questions with one more option, `Other`, whose criteria sentence is
neutral ("none of the themes above fits this request, or the topic is unclear" / "none of the actions above fits this
request, or the action is unclear"). The experiment measures what an abstention option would do to the answers that
the flow and the paper actually use. It is an experiment only: the questions of the paper do not change, and no rule
of the flow reads an `Other` answer (which is exactly why the coverage of its answers matters here).

| Question | `Other` answers | Accuracy with `Other` counted wrong | Accuracy on the answered set | Coverage | Absorbed some wrong answer | Lost some correct answer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Topic | 3 of 96 scored | 85.4 % (82/96) | 88.2 % (82/93) | 96.9 % | 1 of 12 | 2 of 84 |
| Action | 11 of 100 | 72.0 % (72/100) | 80.9 % (72/89) | 89.0 % | 0 of 16 | 11 of 84 |

The 11 lost action answers are the expensive part: every one of them is a request whose correct answer is "Send
reply" (the recorded answer, the gold answer, and the answer of the recorded run all agree), so the neutral criterion
of the extra option attracts the plain replies and nothing else. The topic question loses 2 of its 84 correct answers
and absorbs 1 of its 12 wrong ones; the action question absorbs 0 of its 16 wrong ones and loses 11 of its 84 correct
ones. As a robustness probe the result is negative: on this set the extra option costs more correct answers than it
catches wrong ones, and the flow would have to read the abstention, which no rule does.

## What the probes do not check

* The cue-ablation test: no criterion was run with its own words removed, so the file says nothing about how much of
  the answer each sentence of a criterion carries.
* The reader test: no second reader applied the criteria by hand, so the file says nothing about the agreement
  between the model and a person on these criteria.

## Caveats

* The probes replay the recorded run of the paper but change the inputs, so a changed answer is a property of the
  criteria on this input, not a failure of the system under test, and a stable answer is not a proof of robustness.
* Every probe runs on all 100 requests, so every number is a description of this set, not a blind test. With 7 or 10
  changed answers, a 1- or 7-point move of an accuracy is a handful of requests.
* The paraphrase is one sample of the cheap LLM at temperature 0 (the provider does not promise that temperature 0 is
  deterministic), so a rerun through a fresh cache could differ.
* The recorded run has no invalid answer, so every comparison covers all 100 requests (96 for the topic, which is not
  scored on the requests that need no action).
* The costs are list price on every token of the recorded calls, including the ones found in the cache of the paper's
  run, so they are an upper bound; the second run of the file makes no live call.

## Ready to paste: `experiment/README.md`

> ### Robustness probes (100 requests)
>
> Four probes on the same 100 requests, each one built as its own copy of the criteria so the questions of the paper
> never change. (A) Option order: with the option lists of the topic, action and priority questions reversed, 12 of
> the 100 requests change at least one answer and the action accuracy stays at 83.0 % against the recorded 84.0 %;
> with the lists shuffled (fixed seed), 13 requests change and the action accuracy is 84.0 %. (B) Label swap: the five
> actions renamed to the neutral codes A to E change **0 of 100** answers, and the accuracy stays 84.0 %, which says
> the answers do not depend on the names. (C) Paraphrase: rewriting every request with the cheap LLM (same facts,
> temperature 0) moves answers on 20 requests, most of all the priority field (10 of 100), with an agreement of 97 %
> or better on four of the five fields (99 % on the topic) and 90 % on priority; all 5 checkable facts of the set are
> preserved. (D) An extra, neutral
> `Other` option on the topic and action questions absorbs almost no wrong answer (1 of 12 and 0 of 16) and loses
> correct ones (2 of 84 and 11 of 84), so an abstention option costs more than it catches on this set. The whole file
> costs $0.054 at list price and a rerun is free: every call is cached.

## Ready to paste: paper paragraph

> **Robustness of the criteria.** We probed the five criteria of Triage on the 100 requests, each probe working on its
> own copy of the questions so that the prompt of the run never changed, and comparing every answer with the recorded
> one. Reversing the option lists of the topic, action and priority questions changes at least one answer on 12 of the
> 100 requests (action accuracy 83.0 % against the recorded 84.0 %) and shuffling them changes 13 (84.0 %); renaming
> the five actions to the neutral codes A to E changes **no** answer and keeps the accuracy at 84.0 %, so the answers
> are not carried by the names of the options. Rewriting every request with a cheap model that must keep every fact
> (temperature 0) is the probe that moves the most: 20 requests change at least one answer, mostly the priority field
> (10 of 100), while the other fields keep an agreement of 90 % (priority) to 99 % (topic); the
> 5 request texts that carry a checkable fact keep all 5. Finally, an experimental extra option `Other` with a neutral
> criterion, added to the topic and action questions, mostly hurts: it absorbs 1 of the 12 wrong topic answers and
> none of the 16 wrong action answers, and it takes away 2 and 11 correct ones respectively, so we did not add an
> abstention option to the questions of the flow. The whole probe file costs $0.054 at list price and reruns for free
> from its cache.

## Repro

```sh
cd <repo>
bun run experiment/robustness.ts            # probes A-D on all 100 requests; writes results/robustness.json and the table
bun run experiment/robustness.ts            # same numbers: 0 live calls, 600 cache hits
```
