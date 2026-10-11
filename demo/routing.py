"""Risk routing for the refund-workflow experiment (Python standard library only).

Contents
--------
* ``LogisticRouter``: L2-regularised logistic regression trained by full-batch
  gradient descent on z-scored features.  It is plain logistic regression;
  there is no boosting, no tree ensemble and no other model family here.
* ``auc``: rank-based area under the ROC curve with honest tie handling.
* ``majority_vote`` / ``p1_score``: the non-learned repeated-sampling signal.
* ``p3_risk``: policy P3 (learned probability plus one same-model recheck).
* ``review_budget`` / ``select_top_k``: fixed-budget, label-free blind ranking.

A "sample" is a record from the API client.  Its ``parsed`` entry is either a
validated proposal ``{decision, confidence, transaction_id, payee_id,
amount_cents, reason}`` or ``None`` (unparseable / failed).  A bare proposal dict
(one that has ``decision`` and no ``parsed`` key) is also accepted.

Nothing in this module reads gold labels, tiers or splits.  Labels are only
arguments of ``fit`` (training labels supplied by the caller) and of ``auc``
(evaluation).
"""

import math
import random

DECISIONS = ("approve", "reject", "escalate")

# ---------------------------------------------------------------------------
# Fixed hyper-parameters.  They are fixed here, before any test data is seen,
# and are reproduced verbatim in ``LogisticRouter.to_dict()``.
# ---------------------------------------------------------------------------
L2_STRENGTH = 0.1          # lambda in  mean log-loss + (lambda / 2) * (|w|^2 + b^2)
MAX_ITERATIONS = 5000      # full-batch gradient-descent steps (upper bound)
GRADIENT_TOLERANCE = 1e-9  # stop when the max-abs gradient component is below this
INIT_SCALE = 0.01          # initial weights ~ Uniform(-INIT_SCALE, INIT_SCALE) from the seed
MIN_STD = 1e-12            # a training column with smaller std is "constant" (scale := 1)

# Policy P3 constants (fixed before test).
BAND_LOW = 0.40
BAND_HIGH = 0.60
RECHECK_CONFIDENCE_FLOOR = 0.70   # recheck confidence below this counts as uncertainty
RECHECK_RISK_ADJUSTMENT = 0.50    # added to the P2 probability when the recheck is not clean

BUDGET_FRACTION = 0.25            # fixed-batch review budget k = ceil(N * 0.25)


# ---------------------------------------------------------------------------
# Small numeric helpers
# ---------------------------------------------------------------------------
def _sigmoid(z):
    if z >= 0.0:
        e = math.exp(-z)
        return 1.0 / (1.0 + e)
    e = math.exp(z)
    return e / (1.0 + e)


def _is_real(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def _check_matrix(X, name="X"):
    if not isinstance(X, (list, tuple)) or len(X) == 0:
        raise ValueError(f"{name} must be a non-empty list of feature rows")
    width = None
    for i, row in enumerate(X):
        if not isinstance(row, (list, tuple)) or len(row) == 0:
            raise ValueError(f"{name}[{i}] must be a non-empty list of numbers")
        if width is None:
            width = len(row)
        elif len(row) != width:
            raise ValueError(f"{name}[{i}] has {len(row)} features, expected {width}")
        for j, v in enumerate(row):
            if not _is_real(v):
                raise ValueError(f"{name}[{i}][{j}] is not a finite number")
    return width


# ---------------------------------------------------------------------------
# Learned router
# ---------------------------------------------------------------------------
class LogisticRouter:
    """Normalised logistic regression predicting P(label == 1) = P(needs review).

    Training procedure (all constants above, none tuned on validation or test):
      1. z-score every feature with the training-set mean and population std
         (a constant column keeps scale 1 and becomes all zeros).
      2. Minimise  mean log-loss + (L2_STRENGTH / 2) * (sum(w^2) + b^2)
         by full-batch gradient descent with fixed step 1 / L, where
         L = 0.25 * (n_features + 1) + L2_STRENGTH upper-bounds the Hessian's
         largest eigenvalue for z-scored inputs.  Initial weights come from
         ``random.Random(seed)``; the objective is strongly convex, so the seed
         only affects the path, not the optimum.
      3. Stop after MAX_ITERATIONS or when the max-abs gradient < GRADIENT_TOLERANCE.
    The intercept is regularised too, so a single-class training set still gives
    a finite, shrunken fit.  Such a fit carries no information about the other
    class; ``to_dict()['single_class']`` says so and callers must not generalise.
    """

    def __init__(self, seed=20261003):
        if isinstance(seed, bool) or not isinstance(seed, int):
            raise TypeError("seed must be an int")
        self.seed = seed
        self._fitted = False
        self._stats = {}
        self._mean = []
        self._scale = []
        self._weights = []
        self._intercept = 0.0

    # -- training ---------------------------------------------------------
    def fit(self, X, y):
        width = _check_matrix(X, "X")
        if not isinstance(y, (list, tuple)) or len(y) != len(X):
            raise ValueError("y must be a list with one label per row of X")
        for i, v in enumerate(y):
            if isinstance(v, bool) or not isinstance(v, int) or v not in (0, 1):
                raise ValueError(f"y[{i}] must be the integer 0 or 1")
        n = len(X)
        positives = sum(y)
        negatives = n - positives

        mean = [sum(row[j] for row in X) / n for j in range(width)]
        scale = []
        constant = []
        for j in range(width):
            var = sum((row[j] - mean[j]) ** 2 for row in X) / n
            std = math.sqrt(var)
            if std < MIN_STD:
                scale.append(1.0)
                constant.append(j)
            else:
                scale.append(std)
        Z = [[(row[j] - mean[j]) / scale[j] for j in range(width)] for row in X]

        rng = random.Random(self.seed)
        w = [rng.uniform(-INIT_SCALE, INIT_SCALE) for _ in range(width)]
        b = 0.0
        lipschitz = 0.25 * (width + 1) + L2_STRENGTH
        step = 1.0 / lipschitz

        iterations = 0
        max_grad = float("inf")
        for iterations in range(1, MAX_ITERATIONS + 1):
            grad_w = [0.0] * width
            grad_b = 0.0
            for zi, yi in zip(Z, y):
                err = _sigmoid(b + sum(wj * zj for wj, zj in zip(w, zi))) - yi
                grad_b += err
                for j in range(width):
                    grad_w[j] += err * zi[j]
            grad_b = grad_b / n + L2_STRENGTH * b
            grad_w = [grad_w[j] / n + L2_STRENGTH * w[j] for j in range(width)]
            max_grad = max(abs(grad_b), max(abs(g) for g in grad_w))
            if max_grad < GRADIENT_TOLERANCE:
                break
            b -= step * grad_b
            w = [w[j] - step * grad_w[j] for j in range(width)]

        loss = 0.0
        for zi, yi in zip(Z, y):
            p = _sigmoid(b + sum(wj * zj for wj, zj in zip(w, zi)))
            p = min(max(p, 1e-15), 1.0 - 1e-15)
            loss -= math.log(p) if yi == 1 else math.log(1.0 - p)
        loss /= n
        penalty = 0.5 * L2_STRENGTH * (sum(wj * wj for wj in w) + b * b)

        self._mean = mean
        self._scale = scale
        self._weights = w
        self._intercept = b
        self._stats = {
            "n_train": n,
            "positives": positives,
            "negatives": negatives,
            "single_class": positives == 0 or negatives == 0,
            "constant_feature_indices": constant,
            "iterations": iterations,
            "max_abs_gradient": max_grad,
            "converged": max_grad < GRADIENT_TOLERANCE,
            "train_log_loss": loss,
            "train_regularised_objective": loss + penalty,
        }
        self._fitted = True
        return self

    # -- inference --------------------------------------------------------
    def predict_proba(self, X):
        if not self._fitted:
            raise RuntimeError("LogisticRouter.fit must be called before predict_proba")
        width = _check_matrix(X, "X")
        if width != len(self._weights):
            raise ValueError(f"X has {width} features, router was fitted with {len(self._weights)}")
        out = []
        for row in X:
            z = self._intercept
            for j in range(width):
                z += self._weights[j] * ((row[j] - self._mean[j]) / self._scale[j])
            out.append(_sigmoid(z))
        return out

    def to_dict(self):
        if not self._fitted:
            raise RuntimeError("LogisticRouter.fit must be called before to_dict")
        stats = self._stats
        note = (
            "Plain L2-regularised logistic regression on z-scored features; normalisation "
            "statistics and parameters come from the training rows only."
        )
        if stats["single_class"]:
            note += (
                " The training labels contain a single class, so the fit is only a regularised "
                "intercept/coefficient shrunk toward that class and says nothing about the other class; "
                "its probabilities must not be read as evidence that the router separates risky cases."
            )
        return {
            "model": "logistic_regression",
            "seed": self.seed,
            "hyperparameters": {
                "l2_strength": L2_STRENGTH,
                "l2_applies_to_intercept": True,
                "optimizer": "full-batch gradient descent",
                "step_size": 1.0 / (0.25 * (len(self._weights) + 1) + L2_STRENGTH),
                "max_iterations": MAX_ITERATIONS,
                "gradient_tolerance": GRADIENT_TOLERANCE,
                "init": f"Uniform(-{INIT_SCALE}, {INIT_SCALE}) from random.Random(seed)",
                "min_std": MIN_STD,
            },
            "n_features": len(self._weights),
            "feature_mean": list(self._mean),
            "feature_scale": list(self._scale),
            "weights": list(self._weights),
            "intercept": self._intercept,
            **stats,
            "note": note,
        }


# ---------------------------------------------------------------------------
# AUC
# ---------------------------------------------------------------------------
def auc(labels, scores):
    """Area under the ROC curve = P(score_pos > score_neg) + 0.5 * P(tie).

    Computed from average ranks, so tied scores contribute exactly 1/2 per
    positive/negative pair.  Returns None when the labels contain a single
    class (AUC is undefined), never a fake 0.5.
    """
    if len(labels) != len(scores):
        raise ValueError("labels and scores must have equal length")
    for i, v in enumerate(labels):
        if isinstance(v, bool) or not isinstance(v, int) or v not in (0, 1):
            raise ValueError(f"labels[{i}] must be the integer 0 or 1")
    for i, s in enumerate(scores):
        if not _is_real(s):
            raise ValueError(f"scores[{i}] is not a finite number")
    n = len(labels)
    pos = sum(labels)
    neg = n - pos
    if pos == 0 or neg == 0:
        return None
    order = sorted(range(n), key=lambda i: scores[i])
    rank_sum_pos = 0.0
    start = 0
    while start < n:
        end = start
        while end + 1 < n and scores[order[end + 1]] == scores[order[start]]:
            end += 1
        avg_rank = (start + end) / 2.0 + 1.0  # 1-based average rank of the tie group
        for k in range(start, end + 1):
            if labels[order[k]] == 1:
                rank_sum_pos += avg_rank
        start = end + 1
    return (rank_sum_pos - pos * (pos + 1) / 2.0) / (pos * neg)


# ---------------------------------------------------------------------------
# Samples, majority vote, P1
# ---------------------------------------------------------------------------
def _usable(proposal):
    """Return the proposal dict if it is a well-formed proposal, else None."""
    if not isinstance(proposal, dict):
        return None
    if proposal.get("decision") not in DECISIONS:
        return None
    conf = proposal.get("confidence")
    if not _is_real(conf) or not 0.0 <= conf <= 1.0:
        return None
    return proposal


def sample_proposal(sample):
    """Proposal of one sample record, or None if it is unparseable/failed."""
    if not isinstance(sample, dict):
        return None
    if "parsed" in sample:
        return _usable(sample["parsed"])
    if "decision" in sample:
        return _usable(sample)
    return None


def majority_vote(samples):
    """Return ``(decision, supporting_index)`` over the given samples.

    A decision wins only with a strict majority of ALL samples (count * 2 > n).
    Ties, missing majorities and unparseable samples that prevent a majority
    give ``('escalate', None)``.  ``supporting_index`` is the index of the
    supporting sample with the highest confidence (lowest index on ties).
    """
    n = len(samples)
    if n == 0:
        raise ValueError("samples must not be empty")
    support = {d: [] for d in DECISIONS}
    for i, s in enumerate(samples):
        p = sample_proposal(s)
        if p is not None:
            support[p["decision"]].append(i)
    for d in DECISIONS:
        if len(support[d]) * 2 > n:
            best = max(support[d], key=lambda i: (sample_proposal(samples[i])["confidence"], -i))
            return d, best
    return "escalate", None


def p1_score(samples):
    """Repeated-sampling review risk (higher = needs review); not learned.

        risk = (n - size_of_largest_agreeing_group)      # disagreement / unparseable samples
             + 1  if the majority decision is 'escalate' # includes ties and no-majority
             + 0.5 * (1 - mean confidence)               # unparseable samples count confidence 0

    The integer terms dominate, the confidence term (<= 0.5) only orders cases
    within the same agreement pattern.
    """
    n = len(samples)
    if n == 0:
        raise ValueError("samples must not be empty")
    counts = {d: 0 for d in DECISIONS}
    conf_sum = 0.0
    for s in samples:
        p = sample_proposal(s)
        if p is not None:
            counts[p["decision"]] += 1
            conf_sum += float(p["confidence"])
    decision, _ = majority_vote(samples)
    risk = float(n - max(counts.values()))
    if decision == "escalate":
        risk += 1.0
    risk += 0.5 * (1.0 - conf_sum / n)
    return risk


# ---------------------------------------------------------------------------
# P3: learned probability + one independent same-model recheck inside the band
# ---------------------------------------------------------------------------
def in_band(probability):
    """True for the inclusive P3 recheck band 0.40 <= p <= 0.60."""
    return BAND_LOW <= probability <= BAND_HIGH


def recheck_issues(base_samples, recheck_sample):
    """Reasons the recheck is not a clean confirmation of the base majority (list of str).

    Reasons: base_majority_escalate, recheck_invalid, recheck_escalate,
    recheck_low_confidence (< RECHECK_CONFIDENCE_FLOOR), recheck_disagrees
    (decision differs from the base majority decision).  Empty list = clean.
    """
    base_decision, _ = majority_vote(base_samples)
    issues = []
    if base_decision == "escalate":
        issues.append("base_majority_escalate")
    p = sample_proposal(recheck_sample)
    if p is None:
        issues.append("recheck_invalid")
        return issues
    if p["decision"] == "escalate":
        issues.append("recheck_escalate")
    if p["confidence"] < RECHECK_CONFIDENCE_FLOOR:
        issues.append("recheck_low_confidence")
    if p["decision"] != base_decision:
        issues.append("recheck_disagrees")
    return issues


def p3_risk(p2_probability, base_samples, recheck_sample=None):
    """P3 review risk.

    Outside the band (or when ``recheck_sample`` is None) the risk is the P2
    probability.  Inside the inclusive band the single recheck sample is
    compared with the base majority; any issue from ``recheck_issues`` adds
    RECHECK_RISK_ADJUSTMENT (never lowers risk, never clamped).  A clean recheck
    leaves the probability unchanged; the recheck can only raise risk.
    The caller must supply ``recheck_sample`` exactly for in-band cases.
    """
    if not _is_real(p2_probability) or not 0.0 <= p2_probability <= 1.0:
        raise ValueError("p2_probability must be a probability")
    if not in_band(p2_probability):
        if recheck_sample is not None:
            raise ValueError("recheck_sample supplied for a probability outside the band")
        return float(p2_probability)
    if recheck_sample is None:
        raise ValueError("in-band probability requires the recheck sample")
    if recheck_issues(base_samples, recheck_sample):
        return float(p2_probability) + RECHECK_RISK_ADJUSTMENT
    return float(p2_probability)


# ---------------------------------------------------------------------------
# Fixed review budget and blind ranking
# ---------------------------------------------------------------------------
def review_budget(n):
    """k = ceil(n * 0.25), exact integer arithmetic."""
    if isinstance(n, bool) or not isinstance(n, int) or n < 0:
        raise ValueError("n must be a non-negative int")
    return (n + 3) // 4


def select_top_k(case_ids, scores, k):
    """Case ids of the k highest risks; ties broken by ascending case id (stable, label-free)."""
    if len(case_ids) != len(scores):
        raise ValueError("case_ids and scores must have equal length")
    if len(set(case_ids)) != len(case_ids):
        raise ValueError("case ids must be unique")
    if isinstance(k, bool) or not isinstance(k, int) or k < 0 or k > len(case_ids):
        raise ValueError("k must be an int in 0..len(case_ids)")
    for i, s in enumerate(scores):
        if not _is_real(s):
            raise ValueError(f"scores[{i}] is not a finite number")
    ranked = sorted(range(len(case_ids)), key=lambda i: (-scores[i], case_ids[i]))
    return [case_ids[i] for i in ranked[:k]]
