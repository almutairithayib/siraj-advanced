import uuid
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.goal import FinancialGoal
from backend.app.schemas.goal import FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalResponse, GoalTemplateResponse
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/goals", tags=["Financial Goals"])

# Mock seasonal event templates
GOAL_TEMPLATES = [
    {
        "id": "tpl_hajj",
        "goal_type": "hajj",
        "title": "فريضة الحج",
        "default_target_amount": 25000.0,
        "description": "خطة ادخار مخصصة لحج بيت الله الحرام تشمل تكاليف حملات الحج والتنقل والخدمات.",
        "suggested_timeline_months": 12
    },
    {
        "id": "tpl_umrah",
        "goal_type": "umrah",
        "title": "رحلة العمرة",
        "default_target_amount": 5000.0,
        "description": "ادخر لأداء العمرة في مكة المكرمة شاملة السكن والنقل والإقامة.",
        "suggested_timeline_months": 3
    },
    {
        "id": "tpl_marriage",
        "goal_type": "marriage",
        "title": "تكاليف الزواج والبيت",
        "default_target_amount": 80000.0,
        "description": "خطط لخطوتك القادمة وادخر للمهر وقاعة الأفراح وتجهيز عش الزوجية.",
        "suggested_timeline_months": 24
    },
    {
        "id": "tpl_travel",
        "goal_type": "travel",
        "title": "إجازة الصيف",
        "default_target_amount": 15000.0,
        "description": "ادخر لرحلتك القادمة مع العائلة بدون الحاجة إلى الاقتراض أو استخدام بطاقة الائتمان.",
        "suggested_timeline_months": 6
    },
    {
        "id": "tpl_ramadan",
        "goal_type": "ramadan",
        "title": "مستلزمات شهر رمضان",
        "default_target_amount": 4000.0,
        "description": "استعد للمقاضي الرمضانية وموائد الإفطار والزكاة والصدقات بخطة مسبقة.",
        "suggested_timeline_months": 4
    },
    {
        "id": "tpl_eid",
        "goal_type": "eid",
        "title": "كسوة ومصاريف العيد",
        "default_target_amount": 5000.0,
        "description": "وفّر لشراء ملابس العيد، العيديات للهدايا، وتكاليف احتفالات العيد السعيد.",
        "suggested_timeline_months": 2
    },
    {
        "id": "tpl_school",
        "goal_type": "school",
        "title": "العودة للمدارس والرسوم",
        "default_target_amount": 10000.0,
        "description": "ادخر لشراء المستلزمات المدرسية، الزي، ورسوم المدارس أو الباصات للأبناء.",
        "suggested_timeline_months": 5
    }
]

@router.get("/", response_model=List[FinancialGoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(FinancialGoal).where(FinancialGoal.user_id == current_user.id))
    return result.scalars().all()

@router.get("/templates", response_model=List[GoalTemplateResponse])
async def list_templates(current_user: User = Depends(get_current_user)):
    return GOAL_TEMPLATES

@router.post("/", response_model=FinancialGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: FinancialGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine default plan details if not provided
    details = goal_in.plan_details
    if not details:
        details = {
            "milestones": [
                {"title": "حفظ 25% من الهدف", "amount": float(goal_in.target_amount) * 0.25, "achieved": False},
                {"title": "حفظ 50% من الهدف", "amount": float(goal_in.target_amount) * 0.50, "achieved": False},
                {"title": "حفظ 75% من الهدف", "amount": float(goal_in.target_amount) * 0.75, "achieved": False},
                {"title": "تحقيق الهدف كاملاً", "amount": float(goal_in.target_amount), "achieved": False}
            ]
        }
        
    new_goal = FinancialGoal(
        user_id=current_user.id,
        goal_type=goal_in.goal_type,
        title=goal_in.title,
        target_amount=goal_in.target_amount,
        saved_amount=goal_in.saved_amount,
        target_date=goal_in.target_date,
        plan_details=details,
        status=goal_in.status
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    return new_goal

@router.put("/{goal_id}", response_model=FinancialGoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    goal_update: FinancialGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancialGoal).where(
            and_(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id)
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الهدف المالي غير موجود"
        )
        
    if goal_update.title is not None:
        goal.title = goal_update.title
    if goal_update.saved_amount is not None:
        goal.saved_amount = goal_update.saved_amount
        # Automatically update milestones achieved status
        if goal.plan_details and "milestones" in goal.plan_details:
            milestones = list(goal.plan_details["milestones"])
            for m in milestones:
                if goal.saved_amount >= m["amount"]:
                    m["achieved"] = True
                else:
                    m["achieved"] = False
            goal.plan_details = {"milestones": milestones}
            
    if goal_update.target_amount is not None:
        goal.target_amount = goal_update.target_amount
    if goal_update.target_date is not None:
        goal.target_date = goal_update.target_date
    if goal_update.status is not None:
        goal.status = goal_update.status
    if goal_update.plan_details is not None:
        goal.plan_details = goal_update.plan_details
        
    await db.commit()
    await db.refresh(goal)
    return goal

@router.post("/{goal_id}/plan", response_model=FinancialGoalResponse)
async def generate_ai_plan(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancialGoal).where(
            and_(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id)
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الهدف المالي غير موجود"
        )
        
    # Generate mock AI plan recommendations in Arabic
    target = float(goal.target_amount)
    saved = float(goal.saved_amount)
    remaining = max(0.0, target - saved)
    
    # Calculate duration
    today = date.today()
    months_diff = (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month)
    months = max(1, months_diff)
    required_monthly = remaining / months
    
    # AI plan generation via simplified provider
    plan_data = None
    try:
        from backend.app.ai.ai_provider import generate_text
        import json as _json
        prompt = (
            f"خطط ماليًا لتحقيق الهدف التالي: "
            f"نوع الهدف: {goal.goal_type}, العنوان: {goal.title}. "
            f"المبلغ المستهدف: {target} ر.س, المدخر: {saved} ر.س. "
            f"الأشهر المتبقية: {months}. "
            f"أعطني: monthly_target (رقم), ai_recommendations (قائمة 3 نصائح), milestones (25%,50%,75%,100%). "
            f"أجب بـ JSON فقط."
        )
        raw = await generate_text(prompt, max_tokens=400)
        try:
            start_idx = raw.find('{')
            end_idx = raw.rfind('}') + 1
            if start_idx >= 0:
                plan_data = _json.loads(raw[start_idx:end_idx])
            else:
                raise ValueError('no json')
        except Exception:
            plan_data = None
    except Exception as e:
        plan_data = None
        print(f"Error generating AI plan: {e}")
    plan_details = {
        "monthly_target": round(required_monthly, 2),
        "ai_recommendations": [
            f"لتغطية مبلغ {remaining} ريال خلال {months} أشهر، ستحتاج إلى ادخار {round(required_monthly, 2)} ريال شهرياً.",
            "ننصحك بتقليل مصاريف المقاهي والمطاعم بنسبة 20٪ وتوجيه الفائض مباشرة إلى هذا الهدف.",
            "قم بتفعيل ميزة الادخار التلقائي في تطبيقك البنكي بعد استلام الراتب مباشرة لتفادي صرف الفائض.",
            "متوافق مع الشريعة: يمكنك استثمار المبالغ المدخرة مؤقتاً في صكوك حكومية قصيرة الأجل لزيادة نمو مدخراتك بأمان."
        ],
        "milestones": [
            {"title": "البداية والانطلاق", "amount": 0.0, "achieved": True},
            {"title": "ربع الطريق", "amount": round(target * 0.25, 2), "achieved": saved >= target * 0.25},
            {"title": "منتصف الطريق", "amount": round(target * 0.50, 2), "achieved": saved >= target * 0.50},
            {"title": "أوشكت على الوصول", "amount": round(target * 0.75, 2), "achieved": saved >= target * 0.75},
            {"title": "تحقيق الحلم", "amount": target, "achieved": saved >= target}
        ]
    }
    
    goal.plan_details = plan_details
    await db.commit()
    await db.refresh(goal)
    return goal

