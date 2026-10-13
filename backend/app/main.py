from __future__ import annotations

import csv
import io
import os
import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from .adaption_adapter import AdaptionAdapter
from .analysis import refresh_issues, scenario_score, sentiment_for
from .config import Settings, settings
from .csv_utils import CSVValidationError, parse_feedback_csv, safe_csv_cell
from .db import Database, json_dumps, json_loads, utc_now
from .models import (
    AdaptionRequest,
    AdaptionRunRead,
    FeedbackCreate,
    FeedbackRead,
    FeedbackUpdate,
    HealthRead,
    ImportResult,
    IssueRead,
    IssueStatusUpdate,
    IssueSummary,
    RecommendationRead,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    ScenarioResult,
)


def as_utc_iso(value: datetime | None) -> str:
    if value is None:
        return utc_now()
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat()


def create_app(*, db_path: str | None = None, app_settings: Settings | None = None, auto_seed: bool = False) -> FastAPI:
    current_settings = app_settings or settings
    database = Database(db_path or current_settings.database_path)
    # Initialize eagerly as well as in lifespan so programmatic TestClient use
    # and CLI consumers see the same ready-to-use database.
    database.init()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        database.init()
        if auto_seed:
            try:
                from .seed import seed
                seed(database.path)
            except Exception:
                pass
        yield

    app = FastAPI(
        title="VANTA Signal OS API",
        version="1.0.0",
        description="VANTA Customer Intelligence & Decision Analytics API with Adaption integration.",
        lifespan=lifespan,
    )
    app.state.database = database
    app.state.settings = current_settings
    app.state.adaption = AdaptionAdapter(database, current_settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(current_settings.cors_origins),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def auth(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
        if current_settings.api_key and (not x_api_key or not secrets.compare_digest(x_api_key, current_settings.api_key)):
            raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")

    def db() -> Database:
        return database

    def _issue_summaries(conn: Any, feedback_id: str) -> list[IssueSummary]:
        rows = conn.execute(
            """SELECT i.issue_key, i.title, i.priority_score FROM issues i
               JOIN issue_feedback f ON f.issue_id=i.id WHERE f.feedback_id=? ORDER BY i.priority_score DESC""",
            (feedback_id,),
        ).fetchall()
        return [IssueSummary.model_validate(dict(row)) for row in rows]

    def _feedback_read(conn: Any, row: Any) -> FeedbackRead:
        value = dict(row)
        value["metadata"] = json_loads(value.pop("metadata_json"), {})
        value["issues"] = _issue_summaries(conn, value["id"])
        return FeedbackRead.model_validate(value)

    def _issue_read(row: Any) -> IssueRead:
        value = dict(row)
        value["priority_breakdown"] = json_loads(value.pop("priority_breakdown_json"), {})
        return IssueRead.model_validate(value)

    def _insert_feedback(conn: Any, model: FeedbackCreate, *, feedback_id: str | None = None) -> str:
        feedback_id = feedback_id or str(uuid.uuid4())
        label, sentiment_score = sentiment_for(model.text)
        now = utc_now()
        created = as_utc_iso(model.created_at)
        conn.execute(
            """INSERT INTO feedback(id,text,rating,category,source,sentiment,sentiment_score,metadata_json,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (feedback_id, model.text, model.rating, model.category, model.source, label, sentiment_score,
             json_dumps(model.metadata), created, now),
        )
        return feedback_id

    @app.get("/health", response_model=HealthRead, tags=["system"])
    def health() -> dict[str, Any]:
        availability = app.state.adaption.availability()
        return {"status": "ok", "service": "vanta-signal-os", "adaption": availability}

    @app.post("/api/feedback", response_model=FeedbackRead, status_code=201, dependencies=[Depends(auth)], tags=["feedback"])
    def create_feedback(payload: FeedbackCreate, database: Database = Depends(db)) -> FeedbackRead:
        with database.connection() as conn:
            feedback_id = _insert_feedback(conn, payload)
            refresh_issues(conn)
            row = conn.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone()
            return _feedback_read(conn, row)

    @app.get("/api/feedback", response_model=list[FeedbackRead], dependencies=[Depends(auth)], tags=["feedback"])
    def list_feedback(
        sentiment: str | None = Query(default=None, pattern="^(positive|neutral|negative)$"),
        category: str | None = None,
        issue_key: str | None = None,
        limit: int = Query(default=100, ge=1, le=500),
        offset: int = Query(default=0, ge=0),
        database: Database = Depends(db),
    ) -> list[FeedbackRead]:
        where: list[str] = []
        params: list[Any] = []
        if sentiment:
            where.append("f.sentiment=?")
            params.append(sentiment)
        if category:
            where.append("f.category=?")
            params.append(category)
        if issue_key:
            where.append("EXISTS (SELECT 1 FROM issue_feedback x JOIN issues y ON y.id=x.issue_id WHERE x.feedback_id=f.id AND y.issue_key=?)")
            params.append(issue_key)
        clause = f"WHERE {' AND '.join(where)}" if where else ""
        params.extend([limit, offset])
        with database.connection() as conn:
            rows = conn.execute(f"SELECT f.* FROM feedback f {clause} ORDER BY f.created_at DESC, f.id DESC LIMIT ? OFFSET ?", params).fetchall()
            return [_feedback_read(conn, row) for row in rows]

    @app.get("/api/feedback/{feedback_id}", response_model=FeedbackRead, dependencies=[Depends(auth)], tags=["feedback"])
    def get_feedback(feedback_id: str, database: Database = Depends(db)) -> FeedbackRead:
        with database.connection() as conn:
            row = conn.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Feedback not found")
            return _feedback_read(conn, row)

    @app.patch("/api/feedback/{feedback_id}", response_model=FeedbackRead, dependencies=[Depends(auth)], tags=["feedback"])
    def update_feedback(feedback_id: str, payload: FeedbackUpdate, database: Database = Depends(db)) -> FeedbackRead:
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=400, detail="At least one field is required")
        with database.connection() as conn:
            row = conn.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Feedback not found")
            columns: list[str] = []
            values: list[Any] = []
            for field, value in changes.items():
                if field == "metadata":
                    field = "metadata_json"
                    value = json_dumps(value)
                columns.append(f"{field}=?")
                values.append(value)
            if "text" in changes:
                label, score = sentiment_for(changes["text"])
                columns.extend(["sentiment=?", "sentiment_score=?"])
                values.extend([label, score])
            columns.append("updated_at=?")
            values.extend([utc_now(), feedback_id])
            conn.execute(f"UPDATE feedback SET {', '.join(columns)} WHERE id=?", values)
            refresh_issues(conn)
            return _feedback_read(conn, conn.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone())

    @app.delete("/api/feedback/{feedback_id}", response_model=None, status_code=204, dependencies=[Depends(auth)], tags=["feedback"])
    def delete_feedback(feedback_id: str, database: Database = Depends(db)) -> None:
        with database.connection() as conn:
            cursor = conn.execute("DELETE FROM feedback WHERE id=?", (feedback_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Feedback not found")
            refresh_issues(conn)

    @app.post("/api/feedback/import", response_model=ImportResult, status_code=201, dependencies=[Depends(auth)], tags=["feedback"])
    async def import_feedback(file: UploadFile = File(...), database: Database = Depends(db)) -> ImportResult:
        data = await file.read(current_settings.max_csv_bytes + 1)
        try:
            parsed = parse_feedback_csv(data, max_bytes=current_settings.max_csv_bytes, max_rows=current_settings.max_csv_rows)
        except CSVValidationError as exc:
            raise HTTPException(status_code=400, detail={"code": "invalid_csv", "message": str(exc)}) from exc
        errors = list(parsed.errors)
        ids: list[str] = []
        with database.connection() as conn:
            for index, values in enumerate(parsed.rows, start=1):
                try:
                    model = FeedbackCreate.model_validate(values)
                    ids.append(_insert_feedback(conn, model))
                except ValidationError as exc:
                    errors.append(f"parsed row {index}: {exc.errors()[0].get('msg', 'invalid row')}")
            refresh_issues(conn)
            rows = []
            for feedback_id in ids:
                rows.append(_feedback_read(conn, conn.execute("SELECT * FROM feedback WHERE id=?", (feedback_id,)).fetchone()))
        return ImportResult(imported=len(ids), rejected=len(errors), errors=errors, feedback=rows)

    @app.get("/api/issues", response_model=list[IssueRead], dependencies=[Depends(auth)], tags=["analysis"])
    def list_issues(status: str | None = Query(default=None, pattern="^(open|in_progress|resolved|ignored)$"), database: Database = Depends(db)) -> list[IssueRead]:
        with database.connection() as conn:
            if status:
                rows = conn.execute("SELECT * FROM issues WHERE status=? ORDER BY priority_score DESC, issue_key", (status,)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM issues ORDER BY priority_score DESC, issue_key").fetchall()
            return [_issue_read(row) for row in rows]

    @app.get("/api/issues/{issue_id}", response_model=IssueRead, dependencies=[Depends(auth)], tags=["analysis"])
    def get_issue(issue_id: int, database: Database = Depends(db)) -> IssueRead:
        with database.connection() as conn:
            row = conn.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Issue not found")
            return _issue_read(row)

    @app.patch("/api/issues/{issue_id}", response_model=IssueRead, dependencies=[Depends(auth)], tags=["analysis"])
    @app.patch("/api/issues/{issue_id}/status", response_model=IssueRead, dependencies=[Depends(auth)], tags=["analysis"])
    def update_issue_status(issue_id: int, payload: IssueStatusUpdate, database: Database = Depends(db)) -> IssueRead:
        with database.connection() as conn:
            cursor = conn.execute("UPDATE issues SET status=?,updated_at=? WHERE id=?", (payload.status, utc_now(), issue_id))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Issue not found")
            return _issue_read(conn.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone())

    @app.get("/api/analysis", dependencies=[Depends(auth)], tags=["analysis"])
    @app.get("/api/analysis/summary", dependencies=[Depends(auth)], tags=["analysis"])
    def analysis_summary(database: Database = Depends(db)) -> dict[str, Any]:
        with database.connection() as conn:
            total = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
            sentiments = {row["sentiment"]: row["count"] for row in conn.execute("SELECT sentiment,COUNT(*) count FROM feedback GROUP BY sentiment")}
            issues = [dict(row) for row in conn.execute("SELECT issue_key,title,status,feedback_count,priority_score FROM issues ORDER BY priority_score DESC")]
            return {"feedback_count": total, "sentiment_counts": sentiments, "issue_count": len(issues), "issues": issues}

    @app.get("/api/recommendations", response_model=list[RecommendationRead], dependencies=[Depends(auth)], tags=["analysis"])
    def recommendations(database: Database = Depends(db)) -> list[RecommendationRead]:
        actions = {
            "performance": ["Instrument latency by workflow", "Set a measurable response-time target", "Prioritize the slowest user path"],
            "reliability": ["Reproduce the highest-frequency failure", "Add regression coverage", "Publish an incident follow-up"],
            "billing": ["Audit pricing and charge explanations", "Review cancellation feedback", "Test a clearer billing summary"],
            "usability": ["Run a focused usability session", "Simplify the affected workflow", "Measure completion and drop-off"],
            "feature_request": ["Validate demand with affected users", "Define a smallest useful release", "Track adoption after launch"],
            "support": ["Improve the relevant help content", "Set a response-time expectation", "Review unresolved support themes"],
            "general": ["Review representative feedback", "Clarify the underlying user outcome", "Define a measurable follow-up"],
        }
        with database.connection() as conn:
            rows = conn.execute("SELECT * FROM issues WHERE status IN ('open','in_progress') ORDER BY priority_score DESC LIMIT 10").fetchall()
            return [RecommendationRead(issue_key=row["issue_key"], title=row["title"], priority_score=row["priority_score"], status=row["status"],
                                       rationale=f"Priority is {row['priority_score']:.2f}/100 from frequency, negative rate, rating risk, sentiment risk, and recency.",
                                       suggested_actions=actions.get(row["issue_key"], actions["general"])) for row in rows]

    @app.post("/api/scenarios/compare", response_model=ScenarioComparisonResponse, dependencies=[Depends(auth)], tags=["scenarios"])
    def compare_scenarios(payload: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
        baseline_dict = payload.baseline.model_dump()
        all_scenarios = [payload.baseline, *payload.alternatives]
        scored: list[tuple[str, float, dict[str, float]]] = []
        for scenario in all_scenarios:
            score, breakdown = scenario_score(scenario.model_dump(), baseline_dict)
            scored.append((scenario.name, score, breakdown))
        score_by_name = {name: score for name, score, _ in scored}
        ranks = {name: rank for rank, (name, _, _) in enumerate(sorted(scored, key=lambda item: (-item[1], item[0])), start=1)}
        best_alt = max(payload.alternatives, key=lambda item: (score_by_name[item.name], item.name))

        def result(item: Any, score: float, breakdown: dict[str, float]) -> ScenarioResult:
            return ScenarioResult(name=item.name, score=score, rank=ranks[item.name], recommended=item.name == best_alt.name,
                                  breakdown=breakdown, formula="100*(.35*impact + .20*adoption + .15*satisfaction + .20*revenue - .07*cost - .03*time)")

        baseline_score, baseline_breakdown = next((score, details) for name, score, details in scored if name == payload.baseline.name)
        alternative_results = [result(item, next(score for name, score, _ in scored if name == item.name), next(details for name, _, details in scored if name == item.name)) for item in payload.alternatives]
        return ScenarioComparisonResponse(baseline=result(payload.baseline, baseline_score, baseline_breakdown), alternatives=alternative_results,
                                          recommendation=f"{best_alt.name} ranks highest among the alternatives at {score_by_name[best_alt.name]:.2f}/100.")

    def _adaption_response(result: dict[str, Any]) -> AdaptionRunRead:
        if result.get("status") == "unavailable":
            raise HTTPException(status_code=503, detail={"code": result.get("error_code"), "message": result.get("error_message"), "run_id": result.get("id")})
        if result.get("status") == "failed":
            raise HTTPException(status_code=502, detail={"code": result.get("error_code"), "message": result.get("error_message"), "run_id": result.get("id")})
        return AdaptionRunRead.model_validate(result)

    @app.get("/api/adaption/status", dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_status() -> dict[str, Any]:
        return app.state.adaption.availability()

    @app.get("/api/adaption/datasets", dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_datasets() -> list[dict[str, Any]]:
        return app.state.adaption.list_datasets()

    @app.post("/api/adaption/datasets/upload", dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_upload(name: str | None = None) -> dict[str, Any]:
        return app.state.adaption.upload_dataset(name=name)

    @app.post("/api/adaption/estimate", response_model=AdaptionRunRead, dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_estimate(payload: AdaptionRequest) -> AdaptionRunRead:
        return _adaption_response(app.state.adaption.execute(payload.model_dump(exclude_none=True), estimate=True))

    @app.post("/api/adaption/run", response_model=AdaptionRunRead, dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_run(payload: AdaptionRequest) -> AdaptionRunRead:
        return _adaption_response(app.state.adaption.execute(payload.model_dump(exclude_none=True), estimate=False))

    @app.get("/api/adaption/runs/{run_id}", response_model=AdaptionRunRead, dependencies=[Depends(auth)], tags=["adaption"])
    @app.get("/api/adaption/status/{run_id}", response_model=AdaptionRunRead, dependencies=[Depends(auth)], tags=["adaption"])
    def adaption_run_status(run_id: str) -> AdaptionRunRead:
        result = app.state.adaption.status(run_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Adaption run not found")
        return AdaptionRunRead.model_validate(result)

    @app.get("/api/reports/feedback.csv", dependencies=[Depends(auth)], tags=["reports"])
    def export_feedback_csv(database: Database = Depends(db)) -> StreamingResponse:
        output = io.StringIO(newline="")
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(["id", "text", "rating", "category", "source", "sentiment", "sentiment_score", "created_at"])
        with database.connection() as conn:
            rows = conn.execute("SELECT id,text,rating,category,source,sentiment,sentiment_score,created_at FROM feedback ORDER BY created_at,id").fetchall()
            for row in rows:
                writer.writerow([safe_csv_cell(row[key]) for key in ("id", "text", "rating", "category", "source", "sentiment", "sentiment_score", "created_at")])
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=vanta-feedback.csv"})

    @app.get("/api/reports/summary.json", dependencies=[Depends(auth)], tags=["reports"])
    def export_summary(database: Database = Depends(db)) -> dict[str, Any]:
        return analysis_summary(database)

    @app.get("/api/reports/export", dependencies=[Depends(auth)], tags=["reports"])
    def export_report(format: str = Query(default="json", pattern="^(csv|json)$"), database: Database = Depends(db)) -> Any:
        if format == "csv":
            return export_feedback_csv(database)
        return export_summary(database)

    return app


app = create_app(auto_seed=os.getenv("AUTO_SEED", "true").lower() in ("true", "1", "yes"))
