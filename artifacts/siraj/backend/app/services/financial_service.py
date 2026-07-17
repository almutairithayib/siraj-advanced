import uuid
from datetime import date, timedelta
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from backend.app.models.transaction import Transaction
from backend.app.models.savings import SavingsGoal
from backend.app.models.budget import Budget

async def get_financial_summary(user_id: uuid.UUID, db: AsyncSession) -> dict:
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    # 1. Income this month
    income_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "income",
                Transaction.transaction_date >= start_of_month
            )
        )
    )
    total_income = float(income_res.scalar() or 0.0)

    # 2. Expenses this month
    expense_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month
            )
        )
    )
    total_expense = float(expense_res.scalar() or 0.0)

    # 3. Total Savings (Sum of all active savings goals current_amount)
    savings_res = await db.execute(
        select(func.sum(SavingsGoal.current_amount)).where(
            and_(
                SavingsGoal.user_id == user_id,
                SavingsGoal.status == "active"
            )
        )
    )
    total_savings = float(savings_res.scalar() or 0.0)

    # 4. Savings Rate: (Income - Expense) / Income
    savings_rate = 0.0
    if total_income > 0:
        savings_rate = round(((total_income - total_expense) / total_income) * 100, 2)
        if savings_rate < 0:
            savings_rate = 0.0

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_savings": total_savings,
        "savings_rate": savings_rate
    }

async def get_category_breakdown(user_id: uuid.UUID, db: AsyncSession) -> list:
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    # Total expenses
    total_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month
            )
        )
    )
    total_expense = float(total_res.scalar() or 0.0)

    # Breakdown query
    breakdown_res = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount))
        .where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month
            )
        )
        .group_by(Transaction.category)
    )

    breakdown = []
    for category, amount in breakdown_res.all():
        amt = float(amount or 0.0)
        percentage = round((amt / total_expense) * 100, 2) if total_expense > 0 else 0.0
        breakdown.append({
            "category": category,
            "amount": amt,
            "percentage": percentage
        })

    return breakdown

async def get_budget_vs_actual(user_id: uuid.UUID, db: AsyncSession) -> list:
    # Fetch budgets
    budgets_result = await db.execute(
        select(Budget).where(Budget.user_id == user_id)
    )
    budgets = budgets_result.scalars().all()

    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    analysis = []
    for budget in budgets:
        # Sum transactions in this category for current month
        txn_result = await db.execute(
            select(func.sum(Transaction.amount)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category == budget.category,
                    Transaction.type == "expense",
                    Transaction.transaction_date >= start_of_month
                )
            )
        )
        spent = float(txn_result.scalar() or 0.0)
        remaining = float(budget.limit_amount) - spent
        percentage = (spent / float(budget.limit_amount)) * 100 if budget.limit_amount > 0 else 0.0

        analysis.append({
            "category": budget.category,
            "limit_amount": float(budget.limit_amount),
            "spent_amount": spent,
            "remaining_amount": remaining,
            "percentage_spent": round(percentage, 2),
            "period": budget.period
        })

    return analysis

async def get_recurring_charges(user_id: uuid.UUID, db: AsyncSession) -> list:
    """
    Identifies repeating charges in the last 120 days.
    Groups transactions by description, filters by frequency/date spacing (~25-35 days),
    and variance in amount.
    """
    cutoff_date = date.today() - timedelta(days=120)
    
    # Query all expenses in the last 120 days
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= cutoff_date
            )
        )
        .order_by(Transaction.transaction_date.asc())
    )
    transactions = result.scalars().all()

    # Group by normalized description (e.g. lowercase, clean extra spaces)
    groups = defaultdict(list)
    for t in transactions:
        desc_norm = t.description.strip().lower()
        groups[desc_norm].append(t)

    recurring = []
    for desc, txs in groups.items():
        if len(txs) < 2:
            continue
        
        # Calculate diffs between consecutive transactions
        intervals = []
        amounts = [float(t.amount) for t in txs]
        
        for i in range(1, len(txs)):
            diff = (txs[i].transaction_date - txs[i-1].transaction_date).days
            intervals.append(diff)
            
        # Check if intervals are consistently around 25-35 days (monthly) or 6-8 days (weekly)
        # For simplicity, if average interval is between 25 and 35 days, or we have at least
        # two monthly payments. Also check amount variance (within 15%).
        avg_amount = sum(amounts) / len(amounts)
        amount_variance_ok = all(abs(amt - avg_amount) / avg_amount < 0.15 for amt in amounts)
        
        # Check intervals: any monthly spacing (25-35 days) or weekly (6-8 days)
        is_monthly = any(25 <= iv <= 35 for iv in intervals) or (len(intervals) == 1 and 25 <= intervals[0] <= 35)
        
        if (is_monthly or len(txs) >= 3) and amount_variance_ok:
            recurring.append({
                "description": txs[0].description,
                "category": txs[0].category,
                "average_amount": round(avg_amount, 2),
                "frequency": "monthly" if is_monthly else "regular",
                "last_date": txs[-1].transaction_date,
                "total_occurrences": len(txs)
            })

    return recurring
