"""
Simplified AI agent loop for Siraj — uses OpenAI API with fallback.
"""

import uuid
import asyncio
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from backend.app.models.chat import ChatMessage
from backend.app.ai.ai_provider import generate_text, FALLBACK_MESSAGE_AR
from backend.app.ai.system_prompt import get_system_prompt

logger = logging.getLogger("siraj.ai.agent_loop")


async def run_agent_loop(
    session_id: uuid.UUID,
    user_message: str,
    user_id: uuid.UUID,
    db: AsyncSession
) -> AsyncGenerator[str, None]:
    """
    Main AI agent loop — calls AI provider and streams response chunks.
    """
    # Load recent chat history (last 10 messages)
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
        role = "المستخدم" if msg.role == "user" else "سراج"
        context_lines.append(f"{role}: {msg.content}")

    context_text = "\n".join(context_lines)
    system_prompt = get_system_prompt()

    full_prompt = f"""
سجل المحادثة السابقة:
{context_text}

رسالة المستخدم الجديدة:
{user_message}

أجب على رسالة المستخدم بشكل مفيد ومختصر.
"""

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()

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

    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=response_text,
    )
    db.add(assistant_msg)
    await db.commit()

    # Stream the response word by word
    words = response_text.split()
    for i, word in enumerate(words):
        if i == len(words) - 1:
            yield word
        else:
            yield word + " "
        await asyncio.sleep(0.03)
