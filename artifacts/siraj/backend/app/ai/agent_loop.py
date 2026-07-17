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
from backend.app.ai.ai_provider import generate_text, FALLBACK_MESSAGE_AR
from backend.app.ai.system_prompt import get_system_prompt

logger = logging.getLogger("siraj.ai.agent_loop")


async def _get_financial_summary(user_id: uuid.UUID, db: AsyncSession) -> str:
    """Fetch the user's real transactions from the last 30 days and summarise them."""
    today = date.today()
    month_ago = today - timedelta(days=30)

    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= month_ago,
        )
        .order_by(Transaction.transaction_date.desc())
    )
    txns = result.scalars().all()

    if not txns:
        return "لا توجد معاملات مسجّلة خلال الثلاثين يوماً الماضية."

    total_income = Decimal("0")
    total_expense = Decimal("0")
    by_category: dict[str, Decimal] = defaultdict(Decimal)

    for t in txns:
        amount = Decimal(str(t.amount))
        if t.type == "income":
            total_income += amount
        else:
            total_expense += amount
            by_category[t.category] += amount

    balance = total_income - total_expense
    top_cats = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:3]
    top_cats_str = "، ".join(f"{cat} ({amt:,.0f} ريال)" for cat, amt in top_cats)

    recent = txns[:5]
    recent_str = "\n".join(
        f"  {t.transaction_date} | {t.type} | {t.category} | {float(t.amount):,.0f} ريال | {t.description or ''}"
        for t in recent
    )

    return (
        f"البيانات المالية للمستخدم (آخر 30 يوم):\n"
        f"إجمالي الدخل: {float(total_income):,.0f} ريال\n"
        f"إجمالي المصروفات: {float(total_expense):,.0f} ريال\n"
        f"صافي الرصيد: {float(balance):,.0f} ريال\n"
        f"أكثر فئات الإنفاق: {top_cats_str}\n"
        f"آخر المعاملات:\n{recent_str}"
    )


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

    # Build conversation history text
    history_lines = []
    for msg in history:
        role_label = "المستخدم" if msg.role == "user" else "سراج"
        history_lines.append(f"{role_label}: {msg.content}")
    history_text = "\n".join(history_lines)

    # Fetch real financial data
    financial_summary = await _get_financial_summary(user_id, db)

    system_prompt = get_system_prompt()

    full_prompt = (
        f"{financial_summary}\n\n"
        f"سجل المحادثة:\n{history_text}\n\n"
        f"رسالة المستخدم: {user_message}"
    )

    # Generate AI response
    try:
        response_text = await generate_text(
            prompt=full_prompt,
            system_prompt=system_prompt,
            max_tokens=300,
        )
    except Exception as exc:
        logger.error("Agent loop error: %s", exc)
        response_text = FALLBACK_MESSAGE_AR

    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=response_text,
    )
    db.add(assistant_msg)
    await db.commit()

    return response_text
