from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterator


SCHEMA = """
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    rating REAL,
    category TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    sentiment TEXT NOT NULL,
    sentiment_score REAL NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);

CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    feedback_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    avg_sentiment REAL NOT NULL DEFAULT 0,
    avg_rating REAL,
    priority_score REAL NOT NULL DEFAULT 0,
    priority_breakdown_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_feedback (
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    PRIMARY KEY(issue_id, feedback_id)
);

CREATE TABLE IF NOT EXISTS adaption_runs (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    status TEXT NOT NULL,
    request_json TEXT NOT NULL,
    response_json TEXT,
    provider_run_id TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_adaption_runs_created_at ON adaption_runs(created_at);
"""


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def json_loads(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


class Database:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self._is_memory = str(path) == ":memory:"
        self._connect_path = f"file:insightflow-{uuid.uuid4().hex}?mode=memory&cache=shared" if self._is_memory else str(self.path)
        self._anchor: sqlite3.Connection | None = None

    def init(self) -> None:
        if self._is_memory:
            if self._anchor is None:
                self._anchor = self._new_connection()
            conn = self._anchor
            conn.executescript(SCHEMA)
            conn.commit()
            return
        if str(self.path) != ":memory:":
            self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as conn:
            conn.executescript(SCHEMA)

    def connect(self) -> sqlite3.Connection:
        # A shared in-memory DB is useful for tests while keeping one connection
        # per transaction for file-backed deployments.
        return self._new_connection()

    def _new_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._connect_path, uri=self._is_memory, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        return conn

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        conn = self.connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def row_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None
