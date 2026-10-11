from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any


FORMULA_RE = re.compile(r"^\s*(?:[=@+]|-(?!\d+(?:\.\d+)?\s*$))")
REQUIRED_COLUMNS = {"text"}
ALLOWED_COLUMNS = {"text", "rating", "category", "source", "created_at", "metadata"}


class CSVValidationError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class ParsedCSV:
    rows: list[dict[str, Any]]
    errors: list[str]


def reject_formula(value: str, *, row: int, column: str) -> str:
    if FORMULA_RE.match(value):
        raise CSVValidationError(f"row {row}, column {column}: formula-like cell is not allowed")
    return value


def parse_feedback_csv(data: bytes, *, max_bytes: int = 2_097_152, max_rows: int = 10_000) -> ParsedCSV:
    if len(data) > max_bytes:
        raise CSVValidationError(f"CSV exceeds maximum size of {max_bytes} bytes")
    if b"\x00" in data:
        raise CSVValidationError("CSV contains a NUL byte")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CSVValidationError("CSV must be UTF-8 encoded") from exc
    reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
    if not reader.fieldnames:
        raise CSVValidationError("CSV must contain a header row")
    headers = [header.strip().lower() for header in reader.fieldnames if header is not None]
    if len(headers) != len(set(headers)):
        raise CSVValidationError("CSV contains duplicate column names")
    missing = REQUIRED_COLUMNS - set(headers)
    if missing:
        raise CSVValidationError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    unknown = set(headers) - ALLOWED_COLUMNS
    if unknown:
        raise CSVValidationError(f"CSV contains unsupported columns: {', '.join(sorted(unknown))}")
    # DictReader otherwise keeps the original casing/spacing in row keys.
    # Normalize it once so headers are treated deterministically.
    reader.fieldnames = headers
    rows: list[dict[str, Any]] = []
    errors: list[str] = []

    def iter_rows() -> Any:
        try:
            yield from reader
        except csv.Error as exc:
            raise CSVValidationError(f"malformed CSV: {exc}") from exc

    for row_number, raw in enumerate(iter_rows(), start=2):
        if len(rows) + len(errors) >= max_rows:
            raise CSVValidationError(f"CSV exceeds maximum of {max_rows} data rows")
        if None in raw:
            raise CSVValidationError(f"row {row_number}: too many columns")
        row = {key.strip().lower(): (value or "").strip() for key, value in raw.items() if key is not None}
        try:
            for column, value in row.items():
                reject_formula(value, row=row_number, column=column)
            if not row.get("text"):
                raise CSVValidationError("text is required")
            parsed: dict[str, Any] = {"text": row["text"]}
            for field in ("category", "source"):
                if row.get(field):
                    parsed[field] = row[field]
            if row.get("rating"):
                parsed["rating"] = float(row["rating"])
                if not 1 <= parsed["rating"] <= 5:
                    raise CSVValidationError("rating must be between 1 and 5")
            if row.get("created_at"):
                parsed["created_at"] = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            if row.get("metadata"):
                import json
                parsed["metadata"] = json.loads(row["metadata"])
                if not isinstance(parsed["metadata"], dict):
                    raise CSVValidationError("metadata must be a JSON object")
            rows.append(parsed)
        except CSVValidationError as exc:
            # Formula-like content is a security violation, not a row-quality
            # issue: reject the complete import instead of silently continuing.
            if "formula-like" in str(exc):
                raise
            errors.append(f"row {row_number}: {exc}")
        except (ValueError, TypeError) as exc:
            errors.append(f"row {row_number}: {exc}")
    return ParsedCSV(rows=rows, errors=errors)


def safe_csv_cell(value: Any) -> str:
    """Neutralize formula prefixes when exporting user-controlled data."""
    text = "" if value is None else str(value)
    return "'" + text if FORMULA_RE.match(text) else text
