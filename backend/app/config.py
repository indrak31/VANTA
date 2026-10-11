from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

try:
    from dotenv import load_dotenv

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()
except ImportError:
    pass


def _csv_env(name: str, default: str) -> tuple[str, ...]:
    value = os.getenv(name, default)
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    database_path: Path
    cors_origins: tuple[str, ...]
    api_key: str | None
    max_csv_bytes: int
    max_csv_rows: int
    adaption_timeout_seconds: float

    @classmethod
    def from_env(cls) -> "Settings":
        database_path = Path(os.getenv("DATABASE_PATH", "data/insightflow.sqlite3"))
        return cls(
            database_path=database_path,
            cors_origins=_csv_env(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
            ),
            api_key=os.getenv("INSIGHTFLOW_API_KEY") or None,
            max_csv_bytes=max(1, int(os.getenv("MAX_CSV_BYTES", "2097152"))),
            max_csv_rows=max(1, int(os.getenv("MAX_CSV_ROWS", "10000"))),
            adaption_timeout_seconds=max(1.0, float(os.getenv("ADAPTION_TIMEOUT_SECONDS", "30"))),
        )


settings = Settings.from_env()
