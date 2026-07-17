"""Build financial context for AI prompts."""

import logging
from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from backend.app.models.transaction import Transaction

logger = logging.getLogger("siraj.ai.context")


async def build_context(user_id, db: AsyncSession) -> dict:
    """Build a context dict using last 30 days — same window as agent_loop."""
    try:
        today = date.today()
        month_ago = today - timedelta(days=30)

        income_res = await db.execute(
            select(func.sum(Transaction.amount)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == "income",
                    Transaction.transaction_date >= month_ago,
                )
            )
        )
        total_income = float(income_res.scalar() or 0.0)

        expense_res = await db.execute(
            select(func.sum(Transaction.amount)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == "expense",
                    Transaction.transaction_date >= month_ago,
                )
            )
        )
        total_expense = float(expense_res.scalar() or 0.0)

        # Top spending category
        cats_res = await db.execute(
            select(Transaction.category, func.sum(Transaction.amount).label("total"))
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == "expense",
                    Transaction.transaction_date >= month_ago,
                )
            )
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(1)
        )
        top_row = cats_res.first()
        top_category = top_row[0] if top_row else "غير محدد"

        balance = total_income - total_expense
        health_score = min(100, max(0, int((balance / total_income * 100)) if total_income > 0 else 0))

        return {
            "balance": balance,
            "total_spending": total_expense,
            "total_income": total_income,
            "health_score": health_score,
            "top_category": top_category,
        }
    except Exception as exc:
        logger.warning("Failed to build context: %s", exc)
        return {}
