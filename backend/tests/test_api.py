from fastapi.testclient import TestClient

from app.main import create_app


def test_feedback_issue_workflow_and_adaption_configuration_error(tmp_path, monkeypatch):
    monkeypatch.delenv("ADAPTION_API_KEY", raising=False)
    client = TestClient(create_app(db_path=str(tmp_path / "test.sqlite3")))
    created = client.post("/api/feedback", json={"text": "The app is slow and confusing", "rating": 2})
    assert created.status_code == 201
    assert created.json()["sentiment"] == "negative"
    issues = client.get("/api/issues")
    assert issues.status_code == 200
    assert issues.json()[0]["issue_key"] == "performance"
    issue_id = issues.json()[0]["id"]
    status = client.patch(f"/api/issues/{issue_id}/status", json={"status": "in_progress"})
    assert status.json()["status"] == "in_progress"
    adaption = client.post("/api/adaption/estimate", json={"dataset_id": "dataset-1"})
    assert adaption.status_code == 503
    assert adaption.json()["detail"]["code"] == "adaption_not_configured"
    run_id = adaption.json()["detail"]["run_id"]
    history = client.get(f"/api/adaption/status/{run_id}")
    assert history.status_code == 200
    assert history.json()["status"] == "unavailable"


def test_csv_import_and_report_export(tmp_path):
    client = TestClient(create_app(db_path=str(tmp_path / "test.sqlite3")))
    response = client.post("/api/feedback/import", files={"file": ("feedback.csv", b"text,rating\nGreat and helpful,5\n", "text/csv")})
    assert response.status_code == 201
    assert response.json()["imported"] == 1
    report = client.get("/api/reports/feedback.csv")
    assert report.status_code == 200
    assert "Great and helpful" in report.text
