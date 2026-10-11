from __future__ import annotations

import csv
from pathlib import Path

from .config import settings
from .db import Database


def seed(path: str | Path | None = None) -> int:
    """Load the bundled sample CSV once into the configured database."""
    from .analysis import refresh_issues, sentiment_for
    from .db import json_dumps, utc_now
    import uuid

    database = Database(path or settings.database_path)
    database.init()
    sample = Path(__file__).resolve().parent.parent / "data" / "sample_feedback.csv"
    with database.connection() as conn, sample.open(newline="", encoding="utf-8-sig") as stream:
        existing = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
        if existing:
            return 0
        for row in csv.DictReader(stream):
            label, score = sentiment_for(row["text"])
            now = utc_now()
            conn.execute("""INSERT INTO feedback(id,text,rating,category,source,sentiment,sentiment_score,metadata_json,created_at,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?,?)""", (str(uuid.uuid4()), row["text"], float(row["rating"]), row["category"], row["source"], label, score, json_dumps({}), row["created_at"], now))
        refresh_issues(conn)
        return conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]


if __name__ == "__main__":
    print(f"Seeded {seed()} feedback rows into {settings.database_path}")
