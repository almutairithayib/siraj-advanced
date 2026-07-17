import uuid
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from backend.app.models.alert import Alert
from backend.app.models.budget import Budget
from backend.app.models.transaction import Transaction
from backend.app.models.savings import SavingsGoal

async def check_budget_breach(user_id: uuid.UUID, category: str, db: AsyncSession):
    """
    Checks if the monthly budget for the given category has been breached (80%, 90%, 100%).
    Creates a proactive alert if a threshold is crossed and hasn't been alerted this month.
    """
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    # 1. Fetch budget for this category
    budget_res = await db.execute(
        select(Budget).where(
            and_(Budget.user_id == user_id, Budget.category == category)
        )
    )
    budget = budget_res.scalar_one_or_none()
    if not budget or float(budget.limit_amount) <= 0:
        return

    limit_amount = float(budget.limit_amount)

    # 2. Calculate current month's spending in this category
    spent_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.category == category,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_of_month
            )
        )
    )
    current_spent = float(spent_res.scalar() or 0.0)

    # 3. Determine breach level
    ratio = current_spent / limit_amount
    breach_pct = 0
    if ratio >= 1.0:
        breach_pct = 100
    elif ratio >= 0.90:
        breach_pct = 90
    elif ratio >= 0.80:
        breach_pct = 80

    if breach_pct == 0:
        return

    # 4. Check if an alert for this category and breach level already exists for this month
    alert_check = await db.execute(
        select(Alert).where(
            and_(
                Alert.user_id == user_id,
                Alert.alert_type == "budget_breach",
                Alert.category == category,
                Alert.threshold_amount == float(breach_pct),
                Alert.created_at >= datetime(today.year, today.month, 1)
            )
        )
    )
    existing_alert = alert_check.scalar_one_or_none()
    if existing_alert:
        return

    # 5. Create alert message
    message = f"تنبيه: لقد تجاوزت {breach_pct}٪ من ميزانية فئة '{category}' لهذا الشهر."
    
    new_alert = Alert(
        user_id=user_id,
        alert_type="budget_breach",
        category=category,
        threshold_amount=float(breach_pct),
        message=message,
        is_read=False,
        is_active=True
    )
    db.add(new_alert)
    await db.commit()

async def check_spending_spike(user_id: uuid.UUID, new_transaction: Transaction, db: AsyncSession):
    """
    Checks if a newly created transaction is a spending spike.
    Triggers an alert if the amount is > 3x the user's average transaction amount
    and at least 100 SAR.
    """
    if new_transaction.type != "expense":
        return

    amount = float(new_transaction.amount)
    if amount < 100.0:
        return

    # Get average transaction amount for this user
    avg_res = await db.execute(
        select(func.avg(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.type == "expense"
            )
        )
    )
    avg_val = avg_res.scalar()
    if not avg_val:
        return
    
    avg_amount = float(avg_val)

    if amount > 3.0 * avg_amount:
        # Check if an alert for this spike was already created today to avoid spamming
        today = date.today()
        start_of_day = datetime(today.year, today.month, today.day)
        
        dup_check = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.alert_type == "spending_spike",
                    Alert.category == new_transaction.category,
                    Alert.created_at >= start_of_day
                )
            )
        )
        if dup_check.scalar_one_or_none():
            return

        message = f"تنبيه: تم رصد معاملة شراء مرتفعة بقيمة {amount:,.2f} ريال في '{new_transaction.description}'."
        
        new_alert = Alert(
            user_id=user_id,
            alert_type="spending_spike",
            category=new_transaction.category,
            threshold_amount=new_transaction.amount,
            message=message,
            is_read=False,
            is_active=True
        )
        db.add(new_alert)
        await db.commit()

async def check_goal_milestones(user_id: uuid.UUID, goal_id: uuid.UUID, db: AsyncSession):
    """
    Checks if a savings goal has crossed a milestone (25%, 50%, 75%, 100%).
    Creates a goal_milestone alert if crossed.
    """
    goal_res = await db.execute(
        select(SavingsGoal).where(
            and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
        )
    )
    goal = goal_res.scalar_one_or_none()
    if not goal or float(goal.target_amount) <= 0:
        return

    target = float(goal.target_amount)
    current = float(goal.current_amount)
    pct = (current / target) * 100

    milestone = 0
    if pct >= 100:
        milestone = 100
    elif pct >= 75:
        milestone = 75
    elif pct >= 50:
        milestone = 50
    elif pct >= 25:
        milestone = 25

    if milestone == 0:
        return

    # Check if this milestone alert already exists
    dup_check = await db.execute(
        select(Alert).where(
            and_(
                Alert.user_id == user_id,
                Alert.alert_type == "goal_milestone",
                Alert.category == goal.goal_name,
                Alert.threshold_amount == float(milestone)
            )
        )
    )
    if dup_check.scalar_one_or_none():
        return

    message = f"تهانينا! لقد حققت {milestone}% من هدف ادخار '{goal.goal_name}'."
    
    new_alert = Alert(
        user_id=user_id,
        alert_type="goal_milestone",
        category=goal.goal_name,
        threshold_amount=float(milestone),
        message=message,
        is_read=False,
        is_active=True
    )
    db.add(new_alert)
    await db.commit()
