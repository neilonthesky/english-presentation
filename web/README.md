# FrameForge Support demo

A demo of the AI customer support workflow (v26) for FrameForge, a made-up AI video generation SaaS.
Left: customer chat. Middle: state machine diagram (React Flow). Right: details of the selected state. Bottom: presenter controls.

## Flow states

1. **New**: customer message saved.
2. **Triage**: Jev classifies the request (queue, action, priority, risk flag, injection flag).
   - Priority Critical -> **Queued** (rule `critical`).
   - Injection detected -> **Gather info**, orders ignored, action forced to "Send reply" (rule `injection`).
   - Confidence < floor (`CONFIDENCE_FLOOR`, default 0.6) -> **Clarify** (up to `CLARIFY_ROUNDS`, default 1), else **Queued** (rule `unsure`).
   - Action "Needs staff" -> **Queued** (rule `needs-staff`).
   - Risk flag on without written rules -> **Queued** (rule `risk`).
   - Action "Send reply" or with written rules -> **Gather info** (rule `answer` / `act`).
3. **Clarify**: LLM asks one short follow-up question. Customer replies in chat to re-triage, or chat closes after silence timeout.
4. **Gather info**: looks up account, purchase, and matching help articles.
5. **Rules check**: evaluates written policies for "Start refund" or "Delete data":
   - `allow` -> **Do action**.
   - `deny` -> **Final message** (no action runs; LLM explains refusal).
   - `review` -> **Queued** (needs support staff).
6. **Do action**: runs allowed state-changing action against the ledger.
7. **Final message**: LLM drafts customer message from help articles or action outcome.
8. **Chat open**: prompts customer with resolution popup ("Did this solve your issue?").
   - Yes -> **Resolved**.
   - No -> increments "no" count. Reaching limit (2) routes to **Queued** (reason `customer`).
   - Follow-up message -> restarts as **New**.
   - Customer silent for T -> **Resolved**.
9. **Queued**: locks chat, displays fixed waiting notice, generates summary brief for support staff.
10. **Support staff**: staff takes over, reviews ticket summary, sends reply -> **Chat open**. No staff after T -> **Resolved**.
11. **Resolved**: chat closed.

## Server endpoints

All endpoints are hosted on Hono (`http://127.0.0.1:8787`):
- `POST /api/receive`: save incoming message (`text`, `role`, `customerId`, optional `requestId` to join clarify round).
- `POST /api/classify`: run Jev classifier on chat text.
- `POST /api/triage`: run deterministic triage rules.
- `POST /api/clarify`: ask LLM for a clarifying question.
- `POST /api/gather`: retrieve account, purchase, and relevant help articles.
- `POST /api/rules`: evaluate policy rules for requested action.
- `POST /api/act`: perform action if rules allow.
- `POST /api/final`: generate final LLM reply or answer.
- `POST /api/queue`: lock chat, create ticket and LLM brief.
- `POST /api/reset`: reset session and ledger state.
- `GET /api/customers`: return all mock customer accounts.

## How to run

In `web/`:
```bash
# Terminal 1: start server
bun --hot server/index.ts

# Terminal 2: start UI
bun x vite --port 5199
```

Open `http://localhost:5199` in your browser.

## Credentials

The server makes real API calls:
- Jev classifier: `TYPESAFE_API_KEY` or `omp token typesafe`.
- LLM (`deepseek/deepseek-v4.1-flash` via CommandCode): `COMMAND_CODE_API_KEY` or `omp token commandcode`.

## Mapping to experiment

The demo and experiment share backend logic directly:
- Both call the identical triage rules and state policies in `web/server/saas.ts`.
- Both invoke the same Jev client and LLM generation helpers in `web/server/models.ts`.
- Both evaluate written rules (`policyFor`) and state-changing actions (`perform`) identically.
