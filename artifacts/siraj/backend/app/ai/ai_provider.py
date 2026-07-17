"""
AI provider for Siraj — uses OpenAI-compatible API.
Falls back to a static Arabic message if the API is unavailable.
"""

import asyncio
import logging
import os
from typing import Optional

logger = logging.getLogger("siraj.ai.provider")

FALLBACK_MESSAGE_AR = (
    "عذراً، خدمة المساعد الذكي غير متوفرة مؤقتاً. "
    "يرجى المحاولة مرة أخرى بعد لحظات. "
    "بياناتك المالية آمنة ويمكنك تصفح لوحة التحكم بشكل طبيعي."
)


async def generate_text(prompt: str, system_prompt: str = "", temperature: float = 0.7, max_tokens: int = 1000) -> str:
    """Generate text using OpenAI API or fall back to static message."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, returning fallback message")
        return FALLBACK_MESSAGE_AR

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or FALLBACK_MESSAGE_AR

    except Exception as exc:
        logger.error("AI generation failed: %s", str(exc)[:200])
        return FALLBACK_MESSAGE_AR


async def generate_tip(context: dict) -> str:
    """Generate a personalized financial tip in Arabic."""
    system = (
        "أنت سراج، مستشار مالي ذكي ومتخصص للسوق السعودي. "
        "تجيب باللغة العربية دائماً. نصائحك قصيرة وعملية ومفيدة."
    )
    prompt = f"""
بناءً على هذه البيانات المالية للمستخدم:
- الرصيد الحالي: {context.get('balance', 0):,.0f} ريال
- إجمالي الإنفاق هذا الشهر: {context.get('total_spending', 0):,.0f} ريال  
- مؤشر الصحة المالية: {context.get('health_score', 0)}/100
- أكثر فئة إنفاقاً: {context.get('top_category', 'غير محدد')}

قدّم نصيحة مالية واحدة مختصرة وعملية (جملة أو جملتان فقط).
"""
    return await generate_text(prompt, system_prompt=system, max_tokens=150)
