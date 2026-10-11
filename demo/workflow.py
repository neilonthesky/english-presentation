"""Guarded refund workflow (Python standard library only).

State graph implemented here::

    Intake -> Propose -> { Auto-reject -> Rejected            (terminal, no payment)
                         | Escalate    -> Unresolved           (terminal unless a review is selected)
                         | Authorize   -> Confirm -> Execute   (payment = append to the in-memory journal)
                         | Blocked     -> Unresolved }
    Review (simulated oracle, only when explicitly selected) -> Rejected | Authorize -> Confirm -> Execute

"Execute" only appends an entry to ``GuardedWorkflow.journal``; no real payment
exists anywhere.  The module has no randomness, clock or I/O, so every trace,
journal and audit entry is deterministic.

Guard conditions (all evaluated; every failure code is reported, none repaired):
  unauthorized               trusted ``authorized`` flag is not exactly True
  unconfirmed                confirmation is not exactly True (``attempt``: trusted runtime
                             ``confirmation_received`` AND ``command.confirmed`` must both be
                             True; ``process``: the workflow's own Confirm state)
  malformed_transaction_id / malformed_payee_id / malformed_amount
                             wrong type (amount must be int, not bool)
  unknown_transaction        id is not in the authoritative ledger
  payee_mismatch             payee differs from the authoritative record
  amount_mismatch            amount differs from the authoritative record
  case_transaction_mismatch  (process) proposal id differs from the case's own ledger id
  ledger_snapshot_mismatch   (process) the case's ledger snapshot differs from the store
  case_ledger_missing        (process) the case carries no usable ledger id
  ledger_already_refunded    authoritative record already has already_refunded == True
  duplicate_execution        this transaction was already executed by this workflow
Check-and-execute is one critical section under ``threading.RLock``; payee and
amount written to the journal always come from the authoritative record, never
from model text.  Authorization and confirmation are inputs independent of the model
command; ``command.confirmed`` can never supply either.  A guard failure yields
``final_decision == 'unresolved'`` and is never turned into a correct decision.
"""

import copy
import json
import threading

try:  # run as ``python3 demo/run.py`` (demo/ on sys.path) ...
    from data import ground_truth
except ModuleNotFoundError:  # ... or imported as the ``demo`` package
    from demo.data import ground_truth

DECISIONS = ("approve", "reject", "escalate")
ACTIONS = ("execute", "reject", "escalate")
COMMAND_KEYS = ("action", "transaction_id", "payee_id", "amount_cents", "confirmed")
LEDGER_FIELDS = (
    ("transaction_id", str),
    ("payee_id", str),
    ("amount_cents", int),
    ("age_days", int),
    ("invoice_exists", bool),
    ("already_refunded", bool),
)


def to_json(obj):
    """Deterministic JSON text (sorted keys, ASCII) for traces, journals and audits."""
    return json.dumps(obj, sort_keys=True, ensure_ascii=True, indent=2)


def _is_int(x):
    return isinstance(x, int) and not isinstance(x, bool)


def _result(final_decision, reviewed, executed, blocked, trace):
    return {
        "final_decision": final_decision,
        "reviewed": reviewed,
        "executed": executed,
        "blocked": blocked,
        "trace": trace,
    }


class GuardedWorkflow:
    """Guarded refund workflow.

    ``process`` runs the simulated case flow with its own Authorize/Confirm states.
    ``attempt`` runs a model-issued command; authority comes only from the trusted
    ``authorized`` and ``confirmation_received`` runtime flags (both default False),
    never from fields of the command.
    """

    def __init__(self, ledger_records):
        if not isinstance(ledger_records, (list, tuple)):
            raise TypeError("ledger_records must be a list of ledger dicts")
        self._ledger = {}
        for i, rec in enumerate(ledger_records):
            if not isinstance(rec, dict):
                raise TypeError(f"ledger_records[{i}] must be a dict")
            for name, typ in LEDGER_FIELDS:
                if name not in rec:
                    raise ValueError(f"ledger_records[{i}] lacks field {name!r}")
                value = rec[name]
                ok = _is_int(value) if typ is int else isinstance(value, typ)
                if not ok:
                    raise ValueError(f"ledger_records[{i}].{name} must be {typ.__name__}")
            tx = rec["transaction_id"]
            if tx in self._ledger:
                raise ValueError(f"duplicate transaction_id in authoritative ledger: {tx!r}")
            self._ledger[tx] = {name: rec[name] for name, _ in LEDGER_FIELDS}
        self._lock = threading.RLock()
        self._executed = set()
        self.journal = []  # executed (simulated) payments only, in execution order
        self.audit = []    # every decision outcome incl. guard failures, in order

    # -- read-only views --------------------------------------------------
    @property
    def ledger(self):
        """Deep copy of the authoritative ledger, sorted by transaction id."""
        with self._lock:
            return [copy.deepcopy(self._ledger[k]) for k in sorted(self._ledger)]

    def snapshot(self):
        """JSON-serialisable state: ledger, journal, audit (copies)."""
        with self._lock:
            return {
                "ledger": [copy.deepcopy(self._ledger[k]) for k in sorted(self._ledger)],
                "journal": copy.deepcopy(self.journal),
                "audit": copy.deepcopy(self.audit),
            }

    def to_json(self):
        return to_json(self.snapshot())

    # -- internals --------------------------------------------------------
    def _audit(self, kind, reference, outcome, failures):
        with self._lock:
            self.audit.append(
                {
                    "seq": len(self.audit) + 1,
                    "kind": kind,
                    "reference": reference,
                    "outcome": outcome,
                    "failures": list(failures),
                }
            )

    def _confirm_and_execute(
        self, *, kind, reference, tx, payee, amount, authorized, confirmed,
        authorization_source, confirmation_source, case_ledger=None,
    ):
        """Guard + execute as one critical section.  Returns (executed, failures)."""
        with self._lock:
            failures = []
            if authorized is not True:
                failures.append("unauthorized")
            if confirmed is not True:
                failures.append("unconfirmed")

            record = None
            if not isinstance(tx, str):
                failures.append("malformed_transaction_id")
            else:
                record = self._ledger.get(tx)
                if record is None:
                    failures.append("unknown_transaction")
            if not isinstance(payee, str):
                failures.append("malformed_payee_id")
            elif record is not None and payee != record["payee_id"]:
                failures.append("payee_mismatch")
            if not _is_int(amount):
                failures.append("malformed_amount")
            elif record is not None and amount != record["amount_cents"]:
                failures.append("amount_mismatch")

            if case_ledger is not None:
                case_tx = case_ledger.get("transaction_id")
                if not isinstance(case_tx, str):
                    failures.append("case_ledger_missing")
                else:
                    if isinstance(tx, str) and tx != case_tx:
                        failures.append("case_transaction_mismatch")
                    stored = self._ledger.get(case_tx)
                    if stored is None or any(
                        case_ledger.get(f) != stored[f] for f in ("payee_id", "amount_cents")
                    ):
                        failures.append("ledger_snapshot_mismatch")

            if record is not None:
                if record["already_refunded"] is True:
                    failures.append("ledger_already_refunded")
                if tx in self._executed:
                    failures.append("duplicate_execution")

            if failures:
                self._audit(kind, reference, "blocked", failures)
                return False, failures

            self._executed.add(tx)
            self.journal.append(
                {
                    "seq": len(self.journal) + 1,
                    "reference": reference,
                    "transaction_id": record["transaction_id"],
                    "payee_id": record["payee_id"],
                    "amount_cents": record["amount_cents"],
                    "authorization_source": authorization_source,
                    "confirmation_source": confirmation_source,
                    "simulated_payment_journal_entry_only": True,
                }
            )
            self._audit(kind, reference, "executed", [])
            return True, []

    # -- case processing --------------------------------------------------
    def process(self, case, proposal=None, review=False):
        """Run one refund case.

        ``proposal`` is the validated model proposal dict or None (unparseable /
        no answer).  ``review=True`` explicitly selects the SIMULATED review: the
        deterministic rule oracle ``data.ground_truth`` decides, not a person and
        not the model; it is the only way the business decision can change.
        """
        if not isinstance(case, dict):
            raise TypeError("case must be a dict")
        if not isinstance(review, bool):
            raise TypeError("review must be a bool")
        case_id = case.get("id")
        if not isinstance(case_id, str):
            raise ValueError("case['id'] must be a string")
        trace = [f"Intake: case {case_id}"]

        valid = isinstance(proposal, dict) and proposal.get("decision") in DECISIONS
        if valid:
            conf = proposal.get("confidence")
            conf_text = (
                f" confidence={conf!r}"
                if isinstance(conf, (int, float)) and not isinstance(conf, bool)
                else ""
            )
            trace.append(f"Propose: model proposal decision={proposal['decision']}{conf_text}")
        else:
            trace.append("Propose: no valid model proposal (abstention or unparseable)")

        if review:
            return self._process_review(case, case_id, trace)

        if not valid:
            trace.append("Unresolved: no valid proposal and no review selected; no decision made, no payment")
            self._audit("process", case_id, "unresolved", ["no_valid_proposal"])
            return _result("unresolved", False, False, False, trace)

        decision = proposal["decision"]
        if decision == "escalate":
            trace.append("Escalate: model abstained and no review selected; unresolved, no payment")
            self._audit("process", case_id, "unresolved", ["model_escalated"])
            return _result("unresolved", False, False, False, trace)
        if decision == "reject":
            trace.append("Auto-reject: model proposed reject")
            trace.append("Rejected: terminal state, no payment")
            self._audit("process", case_id, "rejected", [])
            return _result("reject", False, False, False, trace)

        trace.append("Authorize: authorization recorded from the intended auto-approve path")
        executed, failures = self._confirm_and_execute(
            kind="process",
            reference=case_id,
            tx=proposal.get("transaction_id"),
            payee=proposal.get("payee_id"),
            amount=proposal.get("amount_cents"),
            authorized=True,
            confirmed=True,
            authorization_source="auto_approve_path",
            confirmation_source="workflow_confirm_guard",
            case_ledger=case.get("ledger") if isinstance(case.get("ledger"), dict) else {},
        )
        return self._finish_approval(case_id, False, executed, failures, trace)

    def _process_review(self, case, case_id, trace):
        oracle = ground_truth(case)
        if oracle not in ("approve", "reject"):
            raise ValueError(f"ground_truth returned {oracle!r}, expected 'approve' or 'reject'")
        trace.append(
            "Review: SIMULATED review selected (deterministic rule oracle ground_truth; "
            "not a human); the model proposal does not influence the decision"
        )
        trace.append(f"Review: simulated reviewer decision={oracle}")
        if oracle == "reject":
            trace.append("Rejected: terminal state, no payment")
            self._audit("process", case_id, "rejected", [])
            return _result("reject", True, False, False, trace)

        ledger = case.get("ledger") if isinstance(case.get("ledger"), dict) else {}
        trace.append("Authorize: authorization recorded from the simulated review approval")
        executed, failures = self._confirm_and_execute(
            kind="process",
            reference=case_id,
            tx=ledger.get("transaction_id"),
            payee=ledger.get("payee_id"),
            amount=ledger.get("amount_cents"),
            authorized=True,
            confirmed=True,
            authorization_source="simulated_review",
            confirmation_source="workflow_confirm_guard",
            case_ledger=ledger,
        )
        return self._finish_approval(case_id, True, executed, failures, trace)

    @staticmethod
    def _finish_approval(case_id, reviewed, executed, failures, trace):
        if executed:
            trace.append("Confirm: identifiers and amount match the authoritative ledger; no duplicate")
            trace.append("Execute: simulated payment appended to the journal from authoritative data")
            return _result("approve", reviewed, True, False, trace)
        trace.append("Confirm: GUARD_FAIL " + ",".join(failures))
        trace.append("Blocked: guard failed; no payment, case stays unresolved (not repaired)")
        return _result("unresolved", reviewed, False, True, trace)

    # -- invariant commands ----------------------------------------------
    def attempt(self, command, authorized=False, confirmation_received=False):
        """Drive one model-issued command against two independent trusted runtime flags.

        The command schema is ``action`` (execute/reject/escalate), ``transaction_id``,
        ``payee_id``, ``amount_cents`` and ``confirmed`` (bool).  ``authorized`` and
        ``confirmation_received`` are both supplied by the runtime, default to False
        (fail closed) and must be real bools.  ``confirmation_received`` is the
        runtime's record that a confirmation actually arrived; ``command.confirmed`` is
        only the model's claim and is never authority.  Execution needs
        ``authorized is True`` and ``confirmation_received is True`` and
        ``command.confirmed is True``; a command cannot confirm itself.
        Returns the five process keys plus ``reason``.
        """
        if not isinstance(authorized, bool):
            raise TypeError("authorized must be a bool")
        if not isinstance(confirmation_received, bool):
            raise TypeError("confirmation_received must be a bool")
        trace = [
            f"Attempt: runtime authorized={authorized} confirmation_received={confirmation_received} "
            "(trusted flags, independent of command.confirmed)"
        ]

        problems = []
        if not isinstance(command, dict):
            problems.append("malformed_command")
        else:
            problems.extend(f"missing_{k}" for k in COMMAND_KEYS if k not in command)
            if command.get("action") not in ACTIONS:
                problems.append("malformed_action")
            if "confirmed" in command and not isinstance(command["confirmed"], bool):
                problems.append("malformed_confirmed")
        if problems:
            trace.append("Blocked: " + ",".join(problems))
            self._audit("attempt", "attempt", "blocked", problems)
            return self._attempt_result("unresolved", False, True, ",".join(problems), trace)

        action = command["action"]
        trace.append(f"Command: action={action} confirmed={command['confirmed']}")
        if action == "reject":
            trace.append("Rejected: terminal state, no payment")
            self._audit("attempt", "attempt", "rejected", [])
            return self._attempt_result("reject", False, False, "rejected", trace)
        if action == "escalate":
            trace.append("Escalate: unresolved, no payment")
            self._audit("attempt", "attempt", "unresolved", ["command_escalate"])
            return self._attempt_result("unresolved", False, False, "escalated", trace)

        executed, failures = self._confirm_and_execute(
            kind="attempt",
            reference="attempt",
            tx=command["transaction_id"],
            payee=command["payee_id"],
            amount=command["amount_cents"],
            authorized=authorized,
            confirmed=(confirmation_received is True and command["confirmed"] is True),
            authorization_source="runtime_authorized_flag",
            confirmation_source="trusted_runtime_confirmation",
        )
        if executed:
            trace.append("Confirm: authorized, runtime-confirmed, identifiers and amount match the authoritative ledger; no duplicate")
            trace.append("Execute: simulated payment appended to the journal from authoritative data")
            return self._attempt_result("approve", True, False, "ok", trace)
        trace.append("Confirm: GUARD_FAIL " + ",".join(failures))
        trace.append("Blocked: guard failed; no payment")
        return self._attempt_result("unresolved", False, True, ",".join(failures), trace)

    @staticmethod
    def _attempt_result(final_decision, executed, blocked, reason, trace):
        out = _result(final_decision, False, executed, blocked, trace)
        out["reason"] = reason
        return out
