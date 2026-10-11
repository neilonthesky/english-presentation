# FrameForge Support demo

A demo of the AI customer support workflow (v30) for FrameForge, a made-up AI video generation SaaS.
Left: customer chat. Middle: state machine diagram (React Flow). Right: details of the selected state. Bottom: presenter controls.

## Flow states

Eight states. The flow does not leave the chat: the chat answers, or the LLM says plainly what the chat cannot do.

1. **New**: the customer message is saved.
2. **Triage**: Jev classifies the request (topic, action, priority, risk flag, injection flag), each answer with a chance. The chances report classifier quality only; no rule reads them. The action is one of five: Send reply, Start refund, Delete data, Cancel plan, Reset password. Fixed rules choose the next state. The first match wins:
   - Injection flag on -> **Gather info**; the orders in the text are ignored and the action is forced to "Send reply" (rule `injection`).
   - Action "Send reply" -> **Gather info** (rule `answer`). Action "Start refund", "Delete data", "Cancel plan", or "Reset password" -> **Gather info** (rule `act`).
   The priority and the risk flag stay in the classifier answer and in the evaluation; no rule reads them. An invalid classifier answer fails closed: the classify call fails, the flow stops in Triage, and nothing runs.
3. **Gather info**: the system reads the help articles that match the text and only the account fields that the action of Triage needs (a fixed table, `ACCOUNT_FIELDS_OF` in `web/server/saas.ts`). Rules check and the Final message see these fields only.
4. **Rules check**: fixed code checks the written rules for the action on the facts (Refund rule, Data deletion rule, Cancellation rule, Password reset rule):
   - `allow` -> **Do action**.
   - `deny` -> **Final message**, nothing runs.
5. **Do action**: runs the allowed state-changing action against the ledger: Start refund, Delete data, Cancel plan (the plan ends at the end of the paid period), or Reset password (the link goes to the e-mail on file). Send reply changes nothing.
6. **Final message**: the LLM writes the customer text. It answers a question from the help articles and the account, tells the result of Do action, or tells why nothing ran.
7. **Chat open**: the customer reads the message. After N s a popup asks "Did this solve your issue?".
   - Yes -> **Resolved**. No -> the popup comes again; after N times (2) -> **Resolved**.
   - A new message in the same chat -> **New**.
   - Silence for T -> **Resolved**.
8. **Resolved**: the chat is closed. The customer needs a new chat (Reset).

## Server endpoints

All endpoints are hosted on Hono (`http://127.0.0.1:8787`). The server keeps the request between the calls, so each call sends `sessionId` and `requestId`.
- `POST /api/receive`: save the message (`text`, `role`, `customerId`; with `requestId` it is a new message in the same chat).
- `POST /api/classify`: run the Jev classifier on the chat text. The answer also has `trace`: the exact JSON sent to Jev, the exact JSON that came back, the latency, the tokens, and the cost of the call.
- `POST /api/triage`: run the fixed triage rules. The next state is always Gather info.
- `POST /api/gather`: read the help articles and the account fields of the action (`fields`).
- `POST /api/rules`: check the written rules for the action. `next` is `act` or `final`.
- `POST /api/act`: do the action, but only when the rules allow it.
- `POST /api/final`: write the customer text. The answer has a `trace` of the LLM call, like `/api/classify`.
- `POST /api/reset`: reset the session and the ledger.
- `GET /api/customers`: return all demo customer accounts (the four demo customers, and the customers of the dataset of the experiment, so the dataset presets can run).
- `GET /api/presets`: return the messages of the palette and the Jev scores that the server already has.
- `POST /api/presets/score`: score every preset with Jev (the chance of the injection flag). The scores stay in the memory of the server.
- `POST /api/compare`: run one message (`text`, `role`, `customerId`, optional `presetId`) through Level 2 and Level 3 at the same time. Each level returns its steps (time, tokens, cost, a `trace` for each model call), the chosen action, how the request ended, the written rules that stopped it, the customer text, and, for a preset of the dataset, the outcome against the gold result (served, stopped, or error). Nothing changes in the account of the session.

## Presenter controls and panels

- **Payload inspector** (Triage and Final message, in the details panel): the exact JSON that the server sent to Jev (state and questions) or to the LLM (messages), the exact JSON that came back, and the latency, the tokens, and the cost in dollars of the call. The sections fold, and each JSON has a Copy button.
- **Confidence threshold** (slider in the presenter controls, default 0.90): every answer of Jev in Triage shows its chance as a bar with a tick at the threshold. An answer below the threshold is highlighted as low confidence, and the diagram shows a dashed "Low confidence" branch from Triage ("would go to LLM or staff"). This is a client-side picture of the cascade idea. It is advisory: the flow, the rules, and the experiment never read the threshold.
- **Compare** (tab "Compare Level 2 and 3"): the same message through Level 2 (one LLM call chooses the action and applies the written rules itself, the code of `experiment/llm_agent.ts`; nothing checks it) and Level 3 (Jev, fixed rules, the LLM only writes the text), side by side. Time, tokens, and cost per step, the chosen action, and the outcome (ran an action, answered, stopped by a written rule, or error against the gold result for a dataset preset).
- **Messages** (palette button): the prompt-injection ladder (five messages from "Ignore all previous instructions…" to "Hi, can you help me update my billing address?") and the first request of each of the 24 request types of `experiment/data/requests.csv`, with the customer and the sender of the request. Each row shows the injection chance that Jev gives to the text. Opening the palette asks the server to score the messages once; the dates of the dataset customers are moved to today, so every written window stays as long as in the dataset.
- **Blocked by rules**: when Rules check denies, the Rules check block and the arrow to Final message turn red and name the rule ("blocked by Refund rule").
- **Cost of 1M requests** (strip above the diagram): Level 2 and Level 3, from the experiment ($0.61 and $0.28 per 1,000 requests, so $610 and $280 per million) and from the requests of this browser session (mean cost per request times one million; Level 3 from the flow and the compare, Level 2 from the compare).

## How to run

In `web/`:
```bash
# Terminal 1: start the server
bun --hot server/index.ts

# Terminal 2: start the UI
bun x vite --port 5199
```

Open `http://localhost:5199` in your browser.

## Credentials

The server makes real API calls:
- Jev classifier: `TYPESAFE_API_KEY` or `omp token typesafe`.
- LLM (`deepseek/deepseek-v4.1-flash` via CommandCode): `COMMAND_CODE_API_KEY` or `omp token commandcode`.

## Mapping to experiment

The demo and the experiment share the backend logic directly:
- Both call the identical triage rules and written rules in `web/server/saas.ts`.
- Both invoke the same Jev client and LLM generation helpers in `web/server/models.ts`.
- Both evaluate the written rules (`policyFor`, through `rulesStep` in `web/server/steps.ts`) and the state-changing actions (`perform`) identically.
- The compare calls `agentDecision` of `experiment/llm_agent.ts` for Level 2 (read-only import), then does with its answer what `processAgentRequest` of `experiment/pipeline.ts` does. The prices and the outcome rule (`callCost`, `requestOutcome`) also come from `experiment/pipeline.ts`.
- The payload inspector records the calls around `transport.post` of `web/server/models.ts` (`web/server/trace.ts`). The prompts, the questions, and the rules are not changed.
