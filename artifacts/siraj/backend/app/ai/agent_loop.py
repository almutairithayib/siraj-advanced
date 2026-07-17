"""
AI agent loop for Siraj — pulls real user financial data and returns JSON reply.
"""

import uuid
import logging
from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.chat import ChatMessage
from backend.app.models.transaction import Transaction
from backend.app.models.goal import FinancialGoal
from backend.app.models.savings import SavingsGoal
from backend.app.ai.ai_provider import generate_text, FALLBACK_MESSAGE_AR
from backend.app.ai.system_prompt import get_system_prompt

logger = logging.getLogger("siraj.ai.agent_loop")


async def _get_financial_summary(user_id: uuid.UUID, db: AsyncSession) -> str:
    """Build a full financial context from the user's real data."""
    from sqlalchemy import func, and_
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    # --- الرصيد الكامل: كل الدخل - كل المصروفات (منذ البداية) ---
    all_income_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == "income",
        )
    )
    all_expense_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
        )
    )
    total_income_all = Decimal(str(all_income_res.scalar() or 0))
    total_expense_all = Decimal(str(all_expense_res.scalar() or 0))
    balance = total_income_all - total_expense_all

    # --- مصروفات الشهر الحالي ---
    month_txn_result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_of_month,
        )
        .order_by(Transaction.transaction_date.desc())
    )
    month_txns = month_txn_result.scalars().all()

    month_income = Decimal("0")
    month_expense = Decimal("0")
    by_category: dict[str, Decimal] = defaultdict(Decimal)

    for t in month_txns:
        amount = Decimal(str(t.amount))
        if t.type == "income":
            month_income += amount
        else:
            month_expense += amount
            by_category[t.category] += amount

    top_cats = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:3]
    top_cats_str = "، ".join(f"{cat} ({float(amt):,.0f} ريال)" for cat, amt in top_cats) or "لا يوجد"

    recent = month_txns[:5]
    recent_str = "\n".join(
        f"  {t.transaction_date} | {t.type} | {t.category} | {float(t.amount):,.0f} ريال | {t.description or ''}"
        for t in recent
    ) or "  لا توجد معاملات"

    txn_section = (
        f"الرصيد الكامل (منذ البداية): {float(balance):,.0f} ريال\n"
        f"مصروفات الشهر الحالي: {float(month_expense):,.0f} ريال\n"
        f"دخل الشهر الحالي: {float(month_income):,.0f} ريال\n"
        f"أكثر فئات الإنفاق هذا الشهر: {top_cats_str}\n"
        f"آخر المعاملات:\n{recent_str}"
    )

    # --- Financial Goals ---
    goals_result = await db.execute(
        select(FinancialGoal).where(FinancialGoal.user_id == user_id)
    )
    goals = goals_result.scalars().all()

    if goals:
        goals_lines = []
        for g in goals:
            remaining = float(g.target_amount) - float(g.saved_amount)
            goals_lines.append(
                f"  هدف '{g.title}' (نوع: {g.goal_type}) — "
                f"المستهدف: {float(g.target_amount):,.0f} ريال، "
                f"المدخر: {float(g.saved_amount):,.0f} ريال، "
                f"المتبقي: {remaining:,.0f} ريال، "
                f"تاريخ الهدف: {g.target_date}"
            )
        goals_section = "الأهداف المالية:\n" + "\n".join(goals_lines)
    else:
        goals_section = "الأهداف المالية: لا توجد أهداف مالية مسجّلة"

    # --- Savings Goals (Piggy Banks) ---
    savings_result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.user_id == user_id)
    )
    savings = savings_result.scalars().all()

    if savings:
        savings_lines = []
        for s in savings:
            remaining = float(s.target_amount) - float(s.current_amount)
            savings_lines.append(
                f"  حصالة '{s.goal_name}' — "
                f"المستهدف: {float(s.target_amount):,.0f} ريال، "
                f"المدخر: {float(s.current_amount):,.0f} ريال، "
                f"المتبقي: {remaining:,.0f} ريال، "
                f"تاريخ الهدف: {s.target_date}"
            )
        savings_section = "الحصالات (أهداف الادخار):\n" + "\n".join(savings_lines)
    else:
        savings_section = "الحصالات: لا توجد حصالات مسجّلة"

    return f"{txn_section}\n\n{goals_section}\n\n{savings_section}"


async def run_agent_loop(
    session_id: uuid.UUID,
    user_message: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> str:
    """
    Main AI agent — builds context with real financial data, calls AI, saves reply.
    NOTE: User message is already saved by the chat router before calling this.
    """
    # Load recent chat history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history = list(reversed(history_result.scalars().all()))

    history_lines = []
    for msg in history:
        role_label = "المستخدم" if msg.role == "user" else "سراج"
        history_lines.append(f"{role_label}: {msg.content}")
    history_text = "\n".join(history_lines)

    # Fetch real financial data
    financial_summary = await _get_financial_summary(user_id, db)

    full_prompt = (
        f"{financial_summary}\n\n"
        f"سجل المحادثة:\n{history_text}\n\n"
        f"رسالة المستخدم: {user_message}"
    )

    try:
        response_text = await generate_text(
            prompt=full_prompt,
            system_prompt=get_system_prompt(),
            max_tokens=4096,
        )
    except Exception as exc:
        logger.error("Agent loop error: %s", exc)
        response_text = FALLBACK_MESSAGE_AR

    # Save assistant message
    db.add(ChatMessage(session_id=session_id, role="assistant", content=response_text))
    await db.commit()

    return response_text
