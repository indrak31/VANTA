from __future__ import annotations

import importlib
import os
import uuid
from typing import Any

from .config import Settings
from .db import Database, json_dumps, json_loads, utc_now


class AdaptionIntegrationError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 503) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def serialize_sdk_result(result: Any) -> dict[str, Any]:
    if hasattr(result, "model_dump"):
        value = result.model_dump(mode="json")
    elif hasattr(result, "to_dict"):
        value = result.to_dict()
    elif isinstance(result, dict):
        value = result
    else:
        raise AdaptionIntegrationError("invalid_provider_response", "Adaption returned an unsupported response type", 502)
    if not isinstance(value, dict):
        raise AdaptionIntegrationError("invalid_provider_response", "Adaption returned a non-object response", 502)
    return value


class AdaptionAdapter:
    def __init__(self, db: Database, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def availability(self) -> dict[str, Any]:
        key_configured = bool(os.getenv("ADAPTION_API_KEY"))
        try:
            importlib.util.find_spec("adaption")
            sdk_installed = importlib.util.find_spec("adaption") is not None
        except (ImportError, ValueError):
            sdk_installed = False
        return {
            "configured": key_configured and sdk_installed,
            "sdk_installed": sdk_installed,
            "api_key_configured": key_configured,
            "provider": "adaption",
        }

    def _client(self) -> Any:
        key = os.getenv("ADAPTION_API_KEY")
        if not key:
            raise AdaptionIntegrationError("adaption_not_configured", "ADAPTION_API_KEY is not configured")
        try:
            module = importlib.import_module("adaption")
            client_class = getattr(module, "Adaption")
            return client_class(api_key=key, timeout=self.settings.adaption_timeout_seconds)
        except ModuleNotFoundError as exc:
            raise AdaptionIntegrationError("adaption_sdk_unavailable", "The official adaption SDK is not installed") from exc
        except Exception as exc:
            raise AdaptionIntegrationError("adaption_client_error", f"Unable to initialize the Adaption client: {exc}") from exc

    def _record(self, *, operation: str, dataset_id: str, request: dict[str, Any], status: str,
                response: dict[str, Any] | None = None, provider_run_id: str | None = None,
                error_code: str | None = None, error_message: str | None = None, run_id: str | None = None) -> dict[str, Any]:
        run_id = run_id or str(uuid.uuid4())
        now = utc_now()
        with self.db.connection() as conn:
            conn.execute(
                """INSERT INTO adaption_runs(id,operation,dataset_id,status,request_json,response_json,provider_run_id,
                    error_code,error_message,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (run_id, operation, dataset_id, status, json_dumps(request), json_dumps(response) if response is not None else None,
                 provider_run_id, error_code, error_message, now, now),
            )
        return self.get(run_id)

    @staticmethod
    def _provider_run_id(response: dict[str, Any]) -> str | None:
        for key in ("run_id", "runId", "job_id", "jobId", "dataset_id", "datasetId", "id"):
            value = response.get(key)
            if isinstance(value, (str, int)):
                return str(value)
        return None

    def execute(self, request: dict[str, Any], *, estimate: bool) -> dict[str, Any]:
        operation = "estimate" if estimate else "run"
        dataset_id = request["dataset_id"]
        try:
            client = self._client()
        except AdaptionIntegrationError as exc:
            return self._record(operation=operation, dataset_id=dataset_id, request=request, status="unavailable",
                                error_code=exc.code, error_message=exc.message)
        payload = {key: value for key, value in request.items() if key != "dataset_id" and value is not None}
        payload["estimate"] = estimate
        try:
            # adapt is the current official operation; run is retained as the
            # SDK's deprecated compatibility alias for callers that request it.
            method = getattr(client.datasets, "adapt", None) or getattr(client.datasets, "run", None)
            if method is None:
                raise AdaptionIntegrationError("adaption_operation_unavailable", "The installed Adaption SDK exposes no dataset operation", 502)
            result = method(dataset_id, **payload)
            response = serialize_sdk_result(result)
            status = str(response.get("status", "submitted"))
            return self._record(operation=operation, dataset_id=dataset_id, request=request, status=status,
                                response=response, provider_run_id=self._provider_run_id(response))
        except AdaptionIntegrationError as exc:
            return self._record(operation=operation, dataset_id=dataset_id, request=request, status="failed",
                                error_code=exc.code, error_message=exc.message)
        except Exception as exc:
            return self._record(operation=operation, dataset_id=dataset_id, request=request, status="failed",
                                error_code="adaption_request_failed", error_message=str(exc))

    def get(self, run_id: str) -> dict[str, Any] | None:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM adaption_runs WHERE id = ?", (run_id,)).fetchone()
        if row is None:
            return None
        result = dict(row)
        result["request"] = json_loads(result.pop("request_json"), {})
        result["response"] = json_loads(result.pop("response_json"), None)
        result.pop("request", None)  # requests are intentionally not exposed by API responses
        return result

    def status(self, run_id: str) -> dict[str, Any] | None:
        record = self.get(run_id)
        if record is None or record["status"] in {"unavailable", "failed", "succeeded", "completed"}:
            return record
        provider_run_id = record.get("provider_run_id")
        if not provider_run_id:
            return record
        try:
            client = self._client()
            result = client.datasets.get_status(record["dataset_id"])
            response = serialize_sdk_result(result)
            status = str(response.get("status", record["status"]))
            with self.db.connection() as conn:
                conn.execute("UPDATE adaption_runs SET status=?,response_json=?,updated_at=? WHERE id=?",
                             (status, json_dumps(response), utc_now(), run_id))
            return self.get(run_id)
        except AdaptionIntegrationError as exc:
            # Do not invent a status. Preserve the provider response and surface
            # that a live refresh could not be performed.
            record["status_refresh_error"] = {"code": exc.code, "message": exc.message}
            return record
        except Exception as exc:
            record["status_refresh_error"] = {"code": "adaption_status_failed", "message": str(exc)}
            return record
