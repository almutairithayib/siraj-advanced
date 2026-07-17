import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class InvestmentOpportunityResponse(BaseModel):
    id: str
    name: str
    product_type: str  # fund, sukuk, ipo
    risk_level: str  # low, medium, high
    expected_return: float  # e.g., 6.5
    min_investment: float
    description: str

class InvestmentRequestCreate(BaseModel):
    product_name: str
    product_type: str
    amount: float = Field(..., gt=0)
    risk_level: str
    expected_return: float | None = None

class InvestmentRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    product_name: str
    product_type: str
    amount: float
    risk_level: str
    status: str
    expected_return: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvestmentRecommendation(BaseModel):
    opportunity: InvestmentOpportunityResponse
    recommendation_score: int  # 0-100 score
    rationale: str  # text reasoning in Arabic
