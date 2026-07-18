import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.financing import FinancingRequest
from backend.app.schemas.financing import FinancingProductResponse, FinancingRequestCreate, FinancingRequestResponse
from backend.app.services.auth_service import get_current_user
from backend.app.ai.context_builder import build_context

router = APIRouter(prefix="/financing", tags=["Financing"])


def _calc_suitability(
    product_type: str,
    balance: float,
    monthly_spending: float,
    monthly_income: float,
    total_income: float,
):
    """
    يحسب نسبة التوافق (0–100) بناءً على:
    1. نسبة المصروفات للدخل الشهري (الأهم) — إذا المصروفات > الدخل يعني عجز
    2. surplus_months — عدد أشهر الإنفاق التي يغطيها الرصيد
    3. حجم الرصيد الكلي
    """
    # — نسبة العجز/الفائض الشهري —
    if monthly_income > 0:
        expense_ratio = monthly_spending / monthly_income  # >1 = ينفق أكثر من دخله
        monthly_surplus = monthly_income - monthly_spending  # سالب = عجز
    else:
        # لا دخل مسجّل هذا الشهر → نعتبره وضعاً ضاغطاً
        expense_ratio = 1.5
        monthly_surplus = -monthly_spending

    # — أشهر التغطية من الرصيد —
    surplus_months = (balance / monthly_spending) if monthly_spending > 0 else 10.0

    # ——— نقاط الأساس بحسب المنتج ———
    if product_type == "personal":
        if expense_ratio <= 0.6:
            base = 88
        elif expense_ratio <= 0.8:
            base = 75
        elif expense_ratio <= 1.0:
            base = 58
        elif expense_ratio <= 1.2:
            base = 38
        else:
            base = 22          # ينفق أكثر من دخله بفارق كبير

        # تعديل بحسب حجم الرصيد (طوق النجاة)
        if balance >= 50_000:
            base += 8
        elif balance < 5_000:
            base -= 15

        score = int(min(95, max(5, base)))
        if score >= 70:
            reason = "فائضك الشهري يدعم قدرتك على السداد الميسر."
        elif score >= 50:
            reason = "وضعك مقبول؛ راجع قيمة القسط مقارنةً بدخلك الشهري قبل التقديم."
        else:
            reason = "مصروفاتك تتجاوز دخلك الشهري؛ إضافة قسط جديد ستزيد الضغط المالي."

    elif product_type == "auto":
        if expense_ratio <= 0.65:
            base = 80
        elif expense_ratio <= 0.85:
            base = 65
        elif expense_ratio <= 1.0:
            base = 48
        elif expense_ratio <= 1.2:
            base = 30
        else:
            base = 18

        if balance < 10_000:
            base -= 10
        score = int(min(88, max(5, base)))
        if score >= 65:
            reason = "دخلك يتيح لك استيعاب قسط السيارة الشهري بشكل مريح."
        elif score >= 45:
            reason = "يمكنك التقديم مع الحرص على اختيار قسط لا يتجاوز 20٪ من دخلك."
        else:
            reason = "المصروفات الحالية مرتفعة؛ يُفضل تخفيضها قبل الالتزام بقسط السيارة."

    elif product_type == "home":
        # التمويل العقاري أطول التزاماً → أكثر تحفظاً
        if expense_ratio <= 0.55:
            base = 75
        elif expense_ratio <= 0.75:
            base = 58
        elif expense_ratio <= 1.0:
            base = 38
        else:
            base = 18

        if balance < 30_000:
            base -= 12
        elif balance >= 100_000:
            base += 8
        score = int(min(85, max(5, base)))
        if score >= 60:
            reason = "وضعك المالي يسمح بالتفكير في التمويل العقاري طويل الأجل."
        elif score >= 38:
            reason = "التمويل العقاري التزام طويل؛ يُنصح بتحسين نسبة الادخار أولاً."
        else:
            reason = "مصروفاتك الحالية ستضغط بشدة على الأقساط طويلة الأجل."

    elif product_type == "education":
        # هامش ربح 0٪ → دائماً الأقل خطراً
        if expense_ratio <= 1.0:
            base = 85
        elif expense_ratio <= 1.3:
            base = 68
        else:
            base = 52
        score = int(min(92, max(5, base)))
        if score >= 70:
            reason = "هامش ربح 0٪ يجعله الخيار الأذكى والأقل مخاطرة لاستثمار مستقبل أبنائك."
        else:
            reason = "حتى مع ضغط المصروفات، هامش الربح الصفري يجعله الأجدر بالتفكير."

    elif product_type == "business":
        if expense_ratio <= 0.6:
            base = 78
        elif expense_ratio <= 0.85:
            base = 60
        elif expense_ratio <= 1.0:
            base = 42
        else:
            base = 22

        if balance < 20_000:
            base -= 15
        elif balance >= 80_000:
            base += 8
        score = int(min(87, max(5, base)))
        if score >= 62:
            reason = "رصيدك وفائضك الشهري يؤهلانك لدعم نمو مشروعك."
        elif score >= 38:
            reason = "يُنصح بتعزيز رأس المال وتقليص المصروفات قبل التقديم."
        else:
            reason = "وضعك المالي الحالي يحتاج استقراراً أكبر قبل الالتزام بتمويل تجاري."
    else:
        score, reason = 50, "يُنصح بمراجعة شروط المنتج."

    return max(5, score), reason

# Mock financing products for MVP
FINANCING_PRODUCTS = [
    {
        "id": "prod_personal",
        "name": "التمويل الشخصي المتوافق مع الشريعة",
        "product_type": "personal",
        "profit_rate": 2.99,
        "min_amount": 10000.0,
        "max_amount": 250000.0,
        "min_term_months": 12,
        "max_term_months": 60,
        "description": "تمويل شخصي مرن بهامش ربح تنافسي وفترة سداد تصل إلى 5 سنوات، متوافق بالكامل مع أحكام الشريعة الإسلامية."
    },
    {
        "id": "prod_auto",
        "name": "تمويل السيارات (المرابحة)",
        "product_type": "auto",
        "profit_rate": 3.49,
        "min_amount": 30000.0,
        "max_amount": 500000.0,
        "min_term_months": 12,
        "max_term_months": 60,
        "description": "امتلك سيارة أحلامك بنظام المرابحة الإسلامية بأقساط ميسرة وسرعة في إتمام الإجراءات."
    },
    {
        "id": "prod_home",
        "name": "التمويل العقاري (الإجارة الموصوفة في الذمة)",
        "product_type": "home",
        "profit_rate": 4.19,
        "min_amount": 200000.0,
        "max_amount": 5000000.0,
        "min_term_months": 60,
        "max_term_months": 300,
        "description": "حلول تمويل عقاري متكاملة لشراء أرض أو فيلا أو شقة سكنية متوافقة مع ضوابط اللجنة الشرعية."
    },
    {
        "id": "prod_edu",
        "name": "تمويل التعليم بدون هامش ربح",
        "product_type": "education",
        "profit_rate": 0.00,
        "min_amount": 5000.0,
        "max_amount": 100000.0,
        "min_term_months": 6,
        "max_term_months": 24,
        "description": "تمويل مخصص للرسوم الدراسية للمدارس والجامعات بهامش ربح 0٪ لمساعدتك في الاستثمار في مستقبل أبنائك."
    },
    {
        "id": "prod_biz",
        "name": "تمويل المنشآت الصغيرة والمتوسطة",
        "product_type": "business",
        "profit_rate": 4.99,
        "min_amount": 50000.0,
        "max_amount": 2000000.0,
        "min_term_months": 12,
        "max_term_months": 48,
        "description": "ادعم نمو وتوسع شركتك الناشئة بتمويل متوافق مع أحكام الشريعة بالتعاون مع برنامج كفالة."
    }
]

@router.get("/products", response_model=List[FinancingProductResponse])
async def list_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ctx = await build_context(current_user.id, db)
    balance = ctx.get("balance", 0.0)
    monthly_spending = ctx.get("total_spending", 0.0)
    monthly_income = ctx.get("monthly_income", 0.0)
    total_income = ctx.get("total_income", 0.0)

    enriched = []
    for p in FINANCING_PRODUCTS:
        score, reason = _calc_suitability(
            p["product_type"], balance, monthly_spending, monthly_income, total_income
        )
        enriched.append({**p, "suitability": score, "suitability_reason": reason})
    return enriched

@router.post("/requests", response_model=FinancingRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_financing_request(
    request_in: FinancingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify product_type matches one of our products
    valid_types = [p["product_type"] for p in FINANCING_PRODUCTS]
    if request_in.product_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نوع المنتج التمويلي غير صالح"
        )
        
    new_request = FinancingRequest(
        user_id=current_user.id,
        product_type=request_in.product_type,
        amount=request_in.amount,
        term_months=request_in.term_months,
        notes=request_in.notes,
        status="pending"
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[FinancingRequestResponse])
async def list_user_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancingRequest).where(FinancingRequest.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/requests/{request_id}", response_model=FinancingRequestResponse)
async def get_request_details(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancingRequest).where(
            and_(FinancingRequest.id == request_id, FinancingRequest.user_id == current_user.id)
        )
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="طلب التمويل غير موجود"
        )
    return request
