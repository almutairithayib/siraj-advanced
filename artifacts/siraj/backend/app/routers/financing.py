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


def _calc_suitability(product_type: str, balance: float, monthly_spending: float, total_income: float):
    """
    يحسب نسبة التوافق (0–100) والنص الوصفي لكل منتج تمويلي.
    المعايير:
    - surplus_months: عدد أشهر الإنفاق التي يغطيها الرصيد الحالي
    - health_score: نسبة الرصيد من إجمالي الدخل
    """
    surplus_months = (balance / monthly_spending) if monthly_spending > 0 else 10.0
    health = int(balance / total_income * 100) if total_income > 0 else 50
    health = max(0, min(100, health))

    if product_type == "personal":
        base = 50 + min(40, surplus_months * 5)
        score = int(min(95, base))
        if balance < 5_000:
            score = max(20, score - 30)
        if score >= 75:
            reason = "فائضك المالي الحالي يدعم قدرتك على السداد الميسر."
        elif score >= 50:
            reason = "وضعك المالي مقبول، يُنصح بمراجعة الأقساط الشهرية قبل التقديم."
        else:
            reason = "المصروفات الشهرية مرتفعة مقارنة برصيدك، قد تؤثر على السداد."

    elif product_type == "auto":
        base = 40 + min(40, surplus_months * 4)
        score = int(min(88, base))
        if monthly_spending > balance * 0.3:
            score = max(20, score - 20)
        if score >= 70:
            reason = "رصيدك يدعم أقساط السيارة على المدى المتوسط."
        elif score >= 45:
            reason = "يمكنك التقديم مع الانتباه لحجم الأقساط مقارنة بمصروفاتك الشهرية."
        else:
            reason = "المصروفات الحالية مرتفعة، يُفضل تقليصها قبل الالتزام بتمويل السيارة."

    elif product_type == "home":
        base = 30 + min(50, surplus_months * 3)
        score = int(min(85, base))
        if monthly_spending > balance * 0.4:
            score = max(15, score - 25)
        if score >= 65:
            reason = "وضعك المالي يسمح بالتفكير في التمويل العقاري طويل الأجل."
        elif score >= 40:
            reason = "التمويل العقاري التزام طويل؛ يُنصح بتحسين الرصيد أولاً."
        else:
            reason = "المصروفات الحالية مرتفعة وقد تضغط على الأقساط طويلة الأجل."

    elif product_type == "education":
        base = 62 + min(28, surplus_months * 2)
        score = int(min(92, base))
        if score >= 75:
            reason = "هامش ربح 0٪ يجعله الخيار الأذكى والأقل مخاطرة لاستثمار مستقبل أبنائك."
        else:
            reason = "خيار ممتاز بلا هامش ربح، مناسب دائماً بغض النظر عن وضعك المالي."

    elif product_type == "business":
        base = 35 + min(45, surplus_months * 3.5)
        score = int(min(87, base))
        if balance < 20_000:
            score = max(15, score - 25)
        if score >= 65:
            reason = "رصيدك يؤهلك لدعم نمو مشروعك مع برنامج كفالة."
        elif score >= 40:
            reason = "يُنصح بتعزيز رأس المال قبل التقديم لضمان استمرارية المشروع."
        else:
            reason = "يحتاج هذا التمويل رصيداً أعلى؛ يُفضل تقوية الوضع المالي أولاً."
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
    total_income = ctx.get("total_income", 0.0)

    enriched = []
    for p in FINANCING_PRODUCTS:
        score, reason = _calc_suitability(p["product_type"], balance, monthly_spending, total_income)
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
