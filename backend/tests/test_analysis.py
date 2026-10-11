from app.analysis import priority_score, scenario_score, sentiment_for


def test_sentiment_is_deterministic_and_bounded():
    assert sentiment_for("The dashboard is slow and frustrating") == ("negative", -0.6667)
    assert sentiment_for("Simple, helpful and fast") == ("positive", 1.0)


def test_priority_score_exposes_formula_and_increases_with_negative_volume():
    low, low_details = priority_score(feedback_count=1, negative_count=0, avg_rating=5, avg_sentiment=0.8, latest_created_at=None)
    high, high_details = priority_score(feedback_count=10, negative_count=10, avg_rating=1, avg_sentiment=-0.8, latest_created_at=None)
    assert high > low
    assert "formula" in high_details
    assert high_details["weights"]["negative_rate"] == 0.3


def test_scenario_score_returns_reproducible_components():
    baseline = {"adoption_rate": 0.2, "expected_impact": 0.1, "monthly_cost": 100, "implementation_months": 2, "satisfaction_delta": 0, "revenue_lift": 10}
    alternative = {"adoption_rate": 0.8, "expected_impact": 0.7, "monthly_cost": 100, "implementation_months": 2, "satisfaction_delta": 0.4, "revenue_lift": 100}
    score, details = scenario_score(alternative, baseline)
    assert score == 73.61
    assert details["adoption"] == 0.8
    assert details["impact_benefit"] == 0.8
