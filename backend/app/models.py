from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class FeedbackBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=5000)
    rating: float | None = Field(default=None, ge=1, le=5)
    category: str | None = Field(default=None, max_length=100)
    source: str = Field(default="manual", min_length=1, max_length=100)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None

    @field_validator("text", "source", "category", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        return value


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str | None = Field(default=None, min_length=1, max_length=5000)
    rating: float | None = Field(default=None, ge=1, le=5)
    category: str | None = Field(default=None, max_length=100)
    source: str | None = Field(default=None, min_length=1, max_length=100)
    metadata: dict[str, Any] | None = None


class IssueSummary(BaseModel):
    issue_key: str
    title: str
    priority_score: float


class FeedbackRead(FeedbackBase):
    id: str
    sentiment: Literal["positive", "neutral", "negative"]
    sentiment_score: float
    issues: list[IssueSummary] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


IssueStatus = Literal["open", "in_progress", "resolved", "ignored"]


class IssueRead(BaseModel):
    id: int
    issue_key: str
    title: str
    description: str
    status: IssueStatus
    feedback_count: int
    negative_count: int
    avg_sentiment: float
    avg_rating: float | None
    priority_score: float
    priority_breakdown: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class IssueStatusUpdate(BaseModel):
    status: IssueStatus


class ImportResult(BaseModel):
    imported: int
    rejected: int
    errors: list[str]
    feedback: list[FeedbackRead]


class ScenarioInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    adoption_rate: float = Field(ge=0, le=1)
    expected_impact: float = Field(ge=-1, le=1)
    monthly_cost: float = Field(ge=0)
    implementation_months: float = Field(ge=0, le=120)
    satisfaction_delta: float = Field(default=0, ge=-1, le=1)
    revenue_lift: float = Field(default=0, ge=0)


class ScenarioComparisonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    baseline: ScenarioInput
    alternatives: list[ScenarioInput] = Field(min_length=1, max_length=50)

    @field_validator("alternatives")
    @classmethod
    def unique_names(cls, value: list[ScenarioInput]) -> list[ScenarioInput]:
        names = [item.name.casefold() for item in value]
        if len(names) != len(set(names)):
            raise ValueError("scenario names must be unique")
        return value

    @model_validator(mode="after")
    def baseline_name_is_unique(self) -> "ScenarioComparisonRequest":
        names = [self.baseline.name.casefold(), *(item.name.casefold() for item in self.alternatives)]
        if len(names) != len(set(names)):
            raise ValueError("baseline and alternative scenario names must be unique")
        return self


class ScenarioResult(BaseModel):
    name: str
    score: float
    rank: int
    recommended: bool
    breakdown: dict[str, float]
    formula: str


class ScenarioComparisonResponse(BaseModel):
    baseline: ScenarioResult
    alternatives: list[ScenarioResult]
    recommendation: str


class RecommendationRead(BaseModel):
    issue_key: str
    title: str
    priority_score: float
    status: IssueStatus
    rationale: str
    suggested_actions: list[str]


class AdaptionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str = Field(min_length=1, max_length=200)
    column_mapping: dict[str, Any] | None = None
    recipe_specification: dict[str, Any] | None = None
    job_specification: dict[str, Any] | None = None
    brand_controls: dict[str, Any] | None = None
    training_type: Literal["instruction_dataset", "preference_pairs"] = "instruction_dataset"
    language_expansion: dict[str, Any] | None = None


class AdaptionRunRead(BaseModel):
    id: str
    operation: Literal["estimate", "run"]
    dataset_id: str
    status: str
    provider_run_id: str | None = None
    response: dict[str, Any] | None = None
    error_code: str | None = None
    error_message: str | None = None
    status_refresh_error: dict[str, str] | None = None
    created_at: datetime
    updated_at: datetime


class HealthRead(BaseModel):
    status: str
    service: str
    adaption: dict[str, Any]
