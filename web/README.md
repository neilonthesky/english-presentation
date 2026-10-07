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
- `POST /api/classify`: run the Jev classifier on the chat text.
- `POST /api/triage`: run the fixed triage rules. The next state is always Gather info.
- `POST /api/gather`: read the help articles and the account fields of the action (`fields`).
- `POST /api/rules`: check the written rules for the action. `next` is `act` or `final`.
- `POST /api/act`: do the action, but only when the rules allow it.
- `POST /api/final`: write the customer text.
- `POST /api/reset`: reset the session and the ledger.
- `GET /api/customers`: return all demo customer accounts.

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
