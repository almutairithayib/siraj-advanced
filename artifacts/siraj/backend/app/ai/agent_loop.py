"""
AI agent loop for Siraj — returns full response as JSON (Replit proxy-safe).
"""

import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.chat import ChatMessage
from backend.app.ai.ai_provider import generate_text, FALLBACK_MESSAGE_AR
from backend.app.ai.system_prompt import get_system_prompt

logger = logging.getLogger("siraj.ai.agent_loop")


async def run_agent_loop(
    session_id: uuid.UUID,
    user_message: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> str:
    """
    Main AI agent — builds context, calls AI provider, saves reply, returns text.
    NOTE: User message is already saved by the chat router before calling this.
    """
    # Load recent chat history (last 10 messages, excluding the one just saved)
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history = list(reversed(history_result.scalars().all()))

    # Build conversation context
    context_lines = []
    for msg in history:
        role_label = "المستخدم" if msg.role == "user" else "سراج"
        context_lines.append(f"{role_label}: {msg.content}")

    context_text = "\n".join(context_lines)
    system_prompt = get_system_prompt()

    full_prompt = (
        f"سجل المحادثة السابقة:\n{context_text}\n\n"
        f"رسالة المستخدم الجديدة:\n{user_message}\n\n"
        f"أجب على رسالة المستخدم بشكل مفيد ومختصر باللغة العربية."
    )

    # Generate AI response
    try:
        response_text = await generate_text(
            prompt=full_prompt,
            system_prompt=system_prompt,
            max_tokens=500,
        )
    except Exception as exc:
        logger.error("Agent loop error: %s", exc)
        response_text = FALLBACK_MESSAGE_AR

    # Save assistant message to DB
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=response_text,
    )
    db.add(assistant_msg)
    await db.commit()

    return response_text
