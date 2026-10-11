from __future__ import annotations

import math
import re
import sqlite3
from collections import Counter
from datetime import UTC, datetime
from typing import Any, Iterable

from .db import json_dumps, json_loads, utc_now


TOKEN_RE = re.compile(r"[a-z0-9']+")
POSITIVE_WORDS = {
    "amazing", "awesome", "easy", "excellent", "fast", "good", "great", "helpful",
    "love", "smooth", "simple", "useful", "works", "working", "happy", "improve",
}
NEGATIVE_WORDS = {
    "annoying", "bad", "broken", "bug", "confusing", "crash", "difficult", "error",
    "fail", "failed", "frustrating", "hate", "lag", "late", "missing", "poor", "slow",
    "stuck", "timeout", "unreliable", "worse", "worst", "expensive", "overpriced",
}
ISSUE_DEFINITIONS: dict[str, tuple[str, str, frozenset[str]]] = {
    "performance": ("Performance", "Speed, latency, loading, or responsiveness concerns.", frozenset({"slow", "latency", "lag", "speed", "loading", "timeout", "fast", "performance"})),
    "reliability": ("Reliability", "Crashes, errors, failed actions, or availability concerns.", frozenset({"bug", "broken", "error", "crash", "fail", "failed", "failure", "outage", "unreliable"})),
    "billing": ("Billing", "Pricing, charges, subscription, or payment concerns.", frozenset({"price", "pricing", "cost", "billing", "charge", "charged", "payment", "subscription", "expensive", "overpriced"})),
    "usability": ("Usability", "Confusing, difficult, or navigation/interface concerns.", frozenset({"confusing", "difficult", "hard", "navigation", "interface", "ui", "workflow", "simple"})),
    "feature_request": ("Feature requests", "Requests for missing capabilities, integrations, or improvements.", frozenset({"missing", "need", "want", "request", "feature", "integration", "improve"})),
    "support": ("Support", "Help, documentation, or response-time concerns.", frozenset({"support", "help", "documentation", "docs", "response", "respond"})),
}


def tokenize(text: str) -> list[str]:
    return TOKEN_RE.findall(text.lower())


def sentiment_for(text: str) -> tuple[str, float]:
    words = tokenize(text)
    if not words:
        return "neutral", 0.0
    positive = sum(word in POSITIVE_WORDS for word in words)
    negative = sum(word in NEGATIVE_WORDS for word in words)
    # A bounded, length-normalized lexicon score is reproducible and explainable.
    score = max(-1.0, min(1.0, (positive - negative) / max(3.0, math.sqrt(len(words)))))
    label = "positive" if score > 0.1 else "negative" if score < -0.1 else "neutral"
    return label, round(score, 4)


def issue_key_for(text: str) -> str:
    words = set(tokenize(text))
    ranked = sorted(
        ((len(words & terms), key) for key, (_, _, terms) in ISSUE_DEFINITIONS.items()),
        key=lambda item: (-item[0], item[1]),
    )
    return ranked[0][1] if ranked and ranked[0][0] else "general"


def issue_definition(issue_key: str) -> tuple[str, str]:
    if issue_key in ISSUE_DEFINITIONS:
        title, description, _ = ISSUE_DEFINITIONS[issue_key]
        return title, description
    return "General feedback", "Feedback that does not match a named issue cluster."


def priority_score(
    *, feedback_count: int, negative_count: int, avg_rating: float | None, avg_sentiment: float, latest_created_at: str | None
) -> tuple[float, dict[str, Any]]:
    """Return a 0-100 score with its exact component values and weights."""
    volume = min(feedback_count / 10.0, 1.0)
    negativity = negative_count / max(feedback_count, 1)
    rating_risk = (5.0 - avg_rating) / 4.0 if avg_rating is not None else 0.5
    sentiment_risk = max(0.0, min(1.0, (1.0 - avg_sentiment) / 2.0))
    recency = 0.5
    if latest_created_at:
        try:
            age_days = max(0.0, (datetime.now(UTC) - datetime.fromisoformat(latest_created_at)).total_seconds() / 86400)
            recency = max(0.0, min(1.0, 1.0 - age_days / 90.0))
        except (TypeError, ValueError):
            pass
    components = {
        "volume": round(volume, 4),
        "negative_rate": round(negativity, 4),
        "rating_risk": round(rating_risk, 4),
        "sentiment_risk": round(sentiment_risk, 4),
        "recency": round(recency, 4),
    }
    weights = {"volume": 0.25, "negative_rate": 0.3, "rating_risk": 0.2, "sentiment_risk": 0.2, "recency": 0.05}
    score = round(100 * sum(components[key] * weight for key, weight in weights.items()), 2)
    return score, {
        "formula": "100 * (0.25*volume + 0.30*negative_rate + 0.20*rating_risk + 0.20*sentiment_risk + 0.05*recency)",
        "weights": weights,
        "components": components,
    }


def refresh_issues(conn: sqlite3.Connection) -> None:
    """Rebuild deterministic memberships and aggregate issue metrics."""
    rows = conn.execute("SELECT * FROM feedback ORDER BY created_at, id").fetchall()
    now = utc_now()
    existing = {row["issue_key"]: dict(row) for row in conn.execute("SELECT * FROM issues")}
    conn.execute("DELETE FROM issue_feedback")
    grouped: dict[str, list[sqlite3.Row]] = {}
    for row in rows:
        grouped.setdefault(issue_key_for(row["text"]), []).append(row)
    for key in sorted(grouped):
        group = grouped[key]
        title, description = issue_definition(key)
        negative_count = sum(row["sentiment"] == "negative" for row in group)
        ratings = [row["rating"] for row in group if row["rating"] is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
        avg_sentiment = sum(row["sentiment_score"] for row in group) / len(group)
        score, breakdown = priority_score(
            feedback_count=len(group),
            negative_count=negative_count,
            avg_rating=avg_rating,
            avg_sentiment=avg_sentiment,
            latest_created_at=max(row["created_at"] for row in group),
        )
        prior = existing.get(key)
        if prior:
            conn.execute(
                """UPDATE issues SET title=?,description=?,feedback_count=?,negative_count=?,avg_sentiment=?,
                   avg_rating=?,priority_score=?,priority_breakdown_json=?,updated_at=? WHERE id=?""",
                (title, description, len(group), negative_count, round(avg_sentiment, 4),
                 round(avg_rating, 4) if avg_rating is not None else None, score, json_dumps(breakdown), now, prior["id"]),
            )
            issue_id = prior["id"]
        else:
            conn.execute(
                """INSERT INTO issues(issue_key,title,description,status,feedback_count,negative_count,avg_sentiment,
                    avg_rating,priority_score,priority_breakdown_json,created_at,updated_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                (key, title, description, "open", len(group), negative_count,
                 round(avg_sentiment, 4), round(avg_rating, 4) if avg_rating is not None else None,
                 score, json_dumps(breakdown), now, now),
            )
            issue_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.executemany("INSERT INTO issue_feedback(issue_id,feedback_id) VALUES(?,?)", [(issue_id, row["id"]) for row in group])
    # Remove clusters that no longer have feedback, after their link rows are
    # gone. Existing cluster IDs remain stable while they are active.
    if grouped:
        placeholders = ",".join("?" for _ in grouped)
        conn.execute(f"DELETE FROM issues WHERE issue_key NOT IN ({placeholders})", tuple(grouped))
    else:
        conn.execute("DELETE FROM issues")


def scenario_score(scenario: dict[str, Any], baseline: dict[str, Any]) -> tuple[float, dict[str, float]]:
    """Score scenarios against baseline; all values are bounded for comparability."""
    # Benefits are relative to the baseline and costs are normalized to the
    # baseline cost plus one. This avoids hiding the scoring logic in a model.
    impact = max(-1.0, min(1.0, (scenario["expected_impact"] - baseline["expected_impact"] + 1) / 2))
    adoption = max(0.0, min(1.0, scenario["adoption_rate"]))
    satisfaction = max(0.0, min(1.0, (scenario["satisfaction_delta"] - baseline["satisfaction_delta"] + 1) / 2))
    revenue = max(0.0, min(1.0, scenario["revenue_lift"] / max(1.0, baseline["revenue_lift"] + 1.0)))
    cost = max(0.0, min(1.0, scenario["monthly_cost"] / max(1.0, baseline["monthly_cost"] + 1000.0)))
    time_risk = max(0.0, min(1.0, scenario["implementation_months"] / 24.0))
    components = {
        "impact_benefit": round(impact, 4),
        "adoption": round(adoption, 4),
        "satisfaction_benefit": round(satisfaction, 4),
        "revenue_benefit": round(revenue, 4),
        "cost_risk": round(cost, 4),
        "time_risk": round(time_risk, 4),
    }
    score = 100 * (0.35 * impact + 0.2 * adoption + 0.15 * satisfaction + 0.2 * revenue - 0.07 * cost - 0.03 * time_risk)
    return round(score, 2), components
