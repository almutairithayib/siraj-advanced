import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field

class SavingsGoalBase(BaseModel):
    goal_name: str
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    target_date: date
    monthly_contribution: float = Field(default=0.0, ge=0)
    status: str = "active"

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    current_amount: float | None = None
    status: str | None = None
    monthly_contribution: float | None = None

class SavingsGoalResponse(SavingsGoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class SavingsGoalProgressResponse(BaseModel):
    id: uuid.UUID
    goal_name: str
    target_amount: float
    current_amount: float
    percentage_complete: float
    remaining_amount: float
    months_remaining: int
    on_track: bool
