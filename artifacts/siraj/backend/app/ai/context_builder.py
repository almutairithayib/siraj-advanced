"""Build financial context for AI prompts."""

import logging
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("siraj.ai.context")


async def build_context(user_id, db: AsyncSession) -> dict:
    """Build a context dict with the user's financial summary."""
    try:
        from backend.app.services.financial_service import get_financial_summary, get_category_breakdown
        summary = await get_financial_summary(user_id, db)
        breakdown = await get_category_breakdown(user_id, db)
        top_category = breakdown[0]["category"] if breakdown else "غير محدد"
        return {
            "balance": summary.get("total_income", 0) - summary.get("total_expense", 0),
            "total_spending": summary.get("total_expense", 0),
            "health_score": 70,
            "top_category": top_category,
        }
    except Exception as exc:
        logger.warning("Failed to build context: %s", exc)
        return {}
