import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    category: str
    type: str = Field(..., description="income or expense")
    description: str | None = None
    transaction_date: date = Field(default_factory=date.today)

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
