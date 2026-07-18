"""Build financial context for AI prompts."""

import logging
from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from backend.app.models.transaction import Transaction

logger = logging.getLogger("siraj.ai.context")


async def build_context(user_id, db: AsyncSession) -> dict:
    """
    الرصيد الكامل: كل الدخل - كل المصروفات منذ البداية.
    المصروفات والفئات: الشهر الحالي فقط.
    """
    try:
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # الرصيد الكامل (كل الوقت)
        all_income = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.type == "income",
            )
        )
        all_expense = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
            )
        )
        total_income_all = float(all_income.scalar() or 0)
        total_expense_all = float(all_expense.scalar() or 0)
        balance = total_income_all - total_expense_all

        # مصروفات الشهر الحالي
        month_expense = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month,
            )
        )
        total_spending_month = float(month_expense.scalar() or 0)

        # دخل الشهر الحالي
        month_income = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id,
                Transaction.type == "income",
                Transaction.transaction_date >= start_of_month,
            )
        )
        monthly_income = float(month_income.scalar() or 0)

        # أكثر فئة إنفاقاً هذا الشهر
        top_row = await db.execute(
            select(Transaction.category, func.sum(Transaction.amount).label("total"))
            .where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month,
            )
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(1)
        )
        top = top_row.first()
        top_category = top[0] if top else "غير محدد"

        health_score = min(100, max(0, int((balance / total_income_all * 100)) if total_income_all > 0 else 0))

        return {
            "balance": balance,
            "total_spending": total_spending_month,
            "monthly_income": monthly_income,
            "total_income": total_income_all,
            "health_score": health_score,
            "top_category": top_category,
        }
    except Exception as exc:
        logger.warning("Failed to build context: %s", exc)
        return {}
