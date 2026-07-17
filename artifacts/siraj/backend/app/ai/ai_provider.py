"""
AI provider for Siraj — uses Replit AI Integrations (OpenAI-compatible proxy).
Falls back to a static Arabic message if the API is unavailable.
"""

import logging
import os

logger = logging.getLogger("siraj.ai.provider")

FALLBACK_MESSAGE_AR = (
    "عذراً، خدمة المساعد الذكي غير متوفرة مؤقتاً. "
    "يرجى المحاولة مرة أخرى بعد لحظات. "
    "بياناتك المالية آمنة ويمكنك تصفح لوحة التحكم بشكل طبيعي."
)

# Model to use — gpt-5.6-luna is cost-effective and fast for Arabic chat
_MODEL = "gpt-5.6-luna"


def _get_client():
    """Build an AsyncOpenAI client using Replit AI Integrations env vars."""
    from openai import AsyncOpenAI

    base_url = os.getenv("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key  = os.getenv("AI_INTEGRATIONS_OPENAI_API_KEY")

    # Fall back to user-supplied OPENAI_API_KEY if integration vars are missing
    if not base_url or not api_key:
        api_key  = os.getenv("OPENAI_API_KEY", "")
        base_url = None  # use the OpenAI default endpoint

    if not api_key:
        return None, None

    client = AsyncOpenAI(
        api_key=api_key,
        **({"base_url": base_url} if base_url else {}),
    )
    return client, base_url


async def generate_text(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> str:
    """Generate text using Replit AI Integrations (OpenAI-compatible) or fallback."""
    client, base_url = _get_client()

    if client is None:
        logger.warning("No AI credentials found — returning fallback message")
        return FALLBACK_MESSAGE_AR

    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        model = _MODEL

        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=max_tokens,
        )
        result = response.choices[0].message.content
        return result if result else FALLBACK_MESSAGE_AR

    except Exception as exc:
        logger.error("AI generation failed: %s", str(exc)[:300])
        return FALLBACK_MESSAGE_AR


async def generate_tip(context: dict) -> str:
    """Generate a personalized financial tip in Arabic."""
    system = (
        "أنت سراج، مستشار مالي ذكي ومتخصص للسوق السعودي. "
        "تجيب باللغة العربية دائماً. نصائحك قصيرة وعملية ومفيدة."
    )
    prompt = (
        f"بناءً على هذه البيانات المالية للمستخدم:\n"
        f"- الرصيد الحالي: {context.get('balance', 0):,.0f} ريال\n"
        f"- إجمالي الإنفاق هذا الشهر: {context.get('total_spending', 0):,.0f} ريال\n"
        f"- مؤشر الصحة المالية: {context.get('health_score', 0)}/100\n"
        f"- أكثر فئة إنفاقاً: {context.get('top_category', 'غير محدد')}\n\n"
        f"قدّم نصيحة مالية واحدة مختصرة وعملية (جملة أو جملتان فقط)."
    )
    return await generate_text(prompt, system_prompt=system, max_tokens=4096)
