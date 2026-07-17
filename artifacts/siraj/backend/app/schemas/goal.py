import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field

class FinancialGoalBase(BaseModel):
    goal_type: str  # hajj, umrah, marriage, travel, ramadan, eid, school
    title: str
    target_amount: float = Field(..., gt=0)
    saved_amount: float = Field(default=0.0, ge=0)
    target_date: date
    plan_details: dict = Field(default_factory=dict)
    status: str = "active"

class FinancialGoalCreate(FinancialGoalBase):
    pass

class FinancialGoalUpdate(BaseModel):
    title: str | None = None
    saved_amount: float | None = None
    target_amount: float | None = None
    target_date: date | None = None
    status: str | None = None
    plan_details: dict | None = None

class FinancialGoalResponse(FinancialGoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class GoalTemplateResponse(BaseModel):
    id: str
    goal_type: str
    title: str
    default_target_amount: float
    description: str
    suggested_timeline_months: int
