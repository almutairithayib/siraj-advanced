import uuid
import random
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.user import User
from backend.app.models.transaction import Transaction
from backend.app.models.budget import Budget
from backend.app.models.savings import SavingsGoal
from backend.app.models.financing import FinancingRequest
from backend.app.models.investment import InvestmentRequest
from backend.app.models.alert import Alert
from backend.app.models.goal import FinancialGoal
from backend.app.services.auth_service import hash_password

async def seed_data(db: AsyncSession):
    # Check if we already have users (don't seed if already populated)
    user_check = await db.execute(select(User).limit(1))
    if user_check.scalar_one_or_none():
        print("Database already seeded. Skipping...")
        return
        
    print("Seeding database...")
    
    # 1. Create Demo User
    demo_user = User(
        email="sara@siraj.sa",
        full_name="سارة القرني",
        hashed_password=hash_password("12345678"),
        currency="SAR",
        created_at=datetime.utcnow() - timedelta(days=120)
    )
    db.add(demo_user)
    await db.flush()  # to populate demo_user.id
    
    user_id = demo_user.id
    
    # 2. Add Budgets
    budgets = [
        Budget(user_id=user_id, category="السكن والخدمات", limit_amount=4000.0, period="monthly"),
        Budget(user_id=user_id, category="الغذاء والبقالة", limit_amount=2500.0, period="monthly"),
        Budget(user_id=user_id, category="النقل والسيارات", limit_amount=1500.0, period="monthly"),
        Budget(user_id=user_id, category="الترفيه والمطاعم", limit_amount=2000.0, period="monthly"),
        Budget(user_id=user_id, category="الفواتير والالتزامات", limit_amount=1000.0, period="monthly"),
        Budget(user_id=user_id, category="التسوق والمستلزمات", limit_amount=3000.0, period="monthly"),
    ]
    db.add_all(budgets)
    
    # 3. Add Savings Goals
    savings_goals = [
        SavingsGoal(
            user_id=user_id,
            goal_name="صندوق الطوارئ",
            target_amount=30000.0,
            current_amount=12000.0,
            target_date=date.today() + timedelta(days=365),
            monthly_contribution=1000.0,
            status="active"
        ),
        SavingsGoal(
            user_id=user_id,
            goal_name="رحلة العمرة مع العائلة",
            target_amount=8000.0,
            current_amount=5400.0,
            target_date=date.today() + timedelta(days=90),
            monthly_contribution=1500.0,
            status="active"
        )
    ]
    db.add_all(savings_goals)
    
    # 4. Add Financial Goals (Seasonal / Long-term)
    financial_goals = [
        FinancialGoal(
            user_id=user_id,
            goal_type="hajj",
            title="فريضة الحج للعام القادم",
            target_amount=25000.0,
            saved_amount=5000.0,
            target_date=date(2027, 6, 15),
            status="active",
            plan_details={
                "monthly_target": 1000.0,
                "ai_recommendations": [
                    "تم إعداد خطة الحج بنجاح.",
                    "ننصح بادخار 1000 ريال شهرياً لتصل لهدفك في الوقت المحدد.",
                    "تم اقتراح استثمار المدخرات في صكوك عقارية قصيرة الأجل لزيادة العائد."
                ],
                "milestones": [
                    {"title": "حفظ 20% من الهدف", "amount": 5000.0, "achieved": True},
                    {"title": "حفظ 50% من الهدف", "amount": 12500.0, "achieved": False},
                    {"title": "حفظ 100% من الهدف", "amount": 25000.0, "achieved": False}
                ]
            }
        ),
        FinancialGoal(
            user_id=user_id,
            goal_type="ramadan",
            title="تجهيزات شهر رمضان المبارك",
            target_amount=4000.0,
            saved_amount=3000.0,
            target_date=date(2027, 2, 20),
            status="active",
            plan_details={
                "monthly_target": 500.0,
                "ai_recommendations": [
                    "ميزانية مقاضي رمضان جاهزة.",
                    "أنت على وشك إكمال الهدف، متبقي 1000 ريال فقط."
                ],
                "milestones": [
                    {"title": "مرحلة البداية", "amount": 1000.0, "achieved": True},
                    {"title": "مرحلة المنتصف", "amount": 2000.0, "achieved": True},
                    {"title": "تحقيق الهدف", "amount": 4000.0, "achieved": False}
                ]
            }
        )
    ]
    db.add_all(financial_goals)
    
    # 5. Add Financing & Investment Requests
    financing_reqs = [
        FinancingRequest(
            user_id=user_id,
            product_type="personal",
            amount=50000.0,
            term_months=36,
            status="approved",
            notes="طلب تمويل شخصي لتأثيث الشقة بنظام المرابحة متوافق مع أحكام اللجنة الشرعية."
        ),
        FinancingRequest(
            user_id=user_id,
            product_type="auto",
            amount=120000.0,
            term_months=60,
            status="pending",
            notes="طلب تمويل سيارة عائلية هجينة."
        )
    ]
    db.add_all(financing_reqs)
    
    investment_reqs = [
        InvestmentRequest(
            user_id=user_id,
            product_name="صكوك الإنماء العقارية المبتكرة",
            product_type="sukuk",
            amount=10000.0,
            risk_level="low",
            status="active",
            expected_return=6.25
        )
    ]
    db.add_all(investment_reqs)
    
    # 6. Add Alerts
    alerts = [
        Alert(
            user_id=user_id,
            alert_type="budget_breach",
            category="الترفيه والمطاعم",
            threshold_amount=2000.0,
            message="تنبيه: لقد تجاوزت 90٪ من ميزانية فئة 'الترفيه والمطاعم' لهذا الشهر.",
            is_read=False
        ),
        Alert(
            user_id=user_id,
            alert_type="spending_spike",
            category="التسوق والمستلزمات",
            threshold_amount=800.0,
            message="تنبيه: تم رصد معاملة شراء مرتفعة بقيمة 950 ريال في متجر 'جرير'.",
            is_read=False
        ),
        Alert(
            user_id=user_id,
            alert_type="goal_milestone",
            category=None,
            threshold_amount=None,
            message="تهانينا! لقد حققت 60% من هدف ادخار 'رحلة العمرة مع العائلة'.",
            is_read=True
        )
    ]
    db.add_all(alerts)
    
    # 7. Generate ~120 realistic transaction records for the last 3 months
    # Categories:
    # "السكن والخدمات", "الغذاء والبقالة", "النقل والسيارات", "الترفيه والمطاعم", "الفواتير والالتزامات", "التسوق والمستلزمات"
    # Income: Salary (22,000 SAR) on the 27th of each month
    
    today = date.today()
    txns = []
    
    # Generate 4 months of history
    for m in range(4):
        # Determine month dates
        target_month_date = today - timedelta(days=m*30)
        year = target_month_date.year
        month = target_month_date.month
        
        # Monthly Salary Income on 27th
        salary_date = date(year, month, 27)
        if salary_date <= today:
            txns.append(Transaction(
                user_id=user_id,
                amount=22000.00,
                category="الراتب",
                type="income",
                description="راتب شركة أرامكو السعودية",
                transaction_date=salary_date
            ))
            
        # Rent/Housing on 1st of each month (Expense)
        rent_date = date(year, month, 1)
        if rent_date <= today:
            txns.append(Transaction(
                user_id=user_id,
                amount=3500.00,
                category="السكن والخدمات",
                type="expense",
                description="إيجار الشقة السكني",
                transaction_date=rent_date
            ))
            
        # SEC Electricity Bill on 5th
        elec_date = date(year, month, 5)
        if elec_date <= today:
            txns.append(Transaction(
                user_id=user_id,
                amount=random.randint(250, 480),
                category="الفواتير والالتزامات",
                type="expense",
                description="الشركة السعودية للكهرباء SEC",
                transaction_date=elec_date
            ))
            
        # NWC Water Bill on 7th
        water_date = date(year, month, 7)
        if water_date <= today:
            txns.append(Transaction(
                user_id=user_id,
                amount=random.randint(80, 150),
                category="الفواتير والالتزامات",
                type="expense",
                description="شركة المياه الوطنية NWC",
                transaction_date=water_date
            ))
            
        # STC Telecom Bill on 28th
        stc_date = date(year, month, 28)
        if stc_date <= today:
            txns.append(Transaction(
                user_id=user_id,
                amount=350.00,
                category="الفواتير والالتزامات",
                type="expense",
                description="فاتورة جوال وانترنت STC مفوتر",
                transaction_date=stc_date
            ))
            
        # Generate weekly expenses for food, transport, entertainment, shopping
        # Groceries: 4 times a month
        grocery_stores = [
            ("أسواق بنده التجارية", "الغذاء والبقالة"),
            ("أسواق الدانوب", "الغذاء والبقالة"),
            ("أسواق العثيم", "الغذاء والبقالة"),
            ("كارفور السعودية", "الغذاء والبقالة")
        ]
        for w in range(4):
            g_day = 3 + w*7
            g_date = date(year, month, g_day)
            if g_date <= today:
                store, cat = random.choice(grocery_stores)
                txns.append(Transaction(
                    user_id=user_id,
                    amount=random.randint(250, 600),
                    category=cat,
                    type="expense",
                    description=store,
                    transaction_date=g_date
                ))
                
        # Gasoline/Gas Stations: 3 times a month
        gas_stations = [
            ("محطة الدريس للوقود", "النقل والسيارات"),
            ("محطة سهل للوقود", "النقل والسيارات"),
            ("محطة ساسكو SASCO", "النقل والسيارات")
        ]
        for w in range(3):
            gas_day = 5 + w*9
            gas_date = date(year, month, gas_day)
            if gas_date <= today:
                store, cat = random.choice(gas_stations)
                txns.append(Transaction(
                    user_id=user_id,
                    amount=random.randint(80, 140),
                    category=cat,
                    type="expense",
                    description=store,
                    transaction_date=gas_date
                ))
                
        # Restaurants/Cafes: 6-8 times a month
        dining = [
            ("مطاعم البيك", "الترفيه والمطاعم"),
            ("شاورما كلاسك", "الترفيه والمطاعم"),
            ("مايسترو بيتزا", "الترفيه والمطاعم"),
            ("بارنز كافيه Barnes", "الترفيه والمطاعم"),
            ("هاف مليون Half Million", "الترفيه والمطاعم"),
            ("مطعم شواية الخليج", "الترفيه والمطاعم"),
            ("قهوة مختصة - هجين", "الترفيه والمطاعم"),
            ("ستاربكس كافيه", "الترفيه والمطاعم")
        ]
        num_dinings = random.randint(6, 9)
        for d_idx in range(num_dinings):
            day = random.randint(2, 28)
            d_date = date(year, month, day)
            if d_date <= today:
                store, cat = random.choice(dining)
                txns.append(Transaction(
                    user_id=user_id,
                    amount=random.randint(25, 180),
                    category=cat,
                    type="expense",
                    description=store,
                    transaction_date=d_date
                ))
                
        # Shopping: 3-4 times a month
        shopping = [
            ("مكتبة جرير", "التسوق والمستلزمات"),
            ("متجر نون الإلكتروني Noon", "التسوق والمستلزمات"),
            ("متجر نمشي Namshi", "التسوق والمستلزمات"),
            ("صيدلية النهدي", "التسوق والمستلزمات"),
            ("اكسترا للأجهزة Extra", "التسوق والمستلزمات"),
            ("سنتربوينت Centerpoint", "التسوق والمستلزمات")
        ]
        num_shopping = random.randint(2, 5)
        for s_idx in range(num_shopping):
            day = random.randint(2, 28)
            s_date = date(year, month, day)
            if s_date <= today:
                store, cat = random.choice(shopping)
                txns.append(Transaction(
                    user_id=user_id,
                    amount=random.randint(50, 950),
                    category=cat,
                    type="expense",
                    description=store,
                    transaction_date=s_date
                ))
                
        # Add a couple of other transfers or random incomes (e.g. peer transfers)
        if m % 2 == 0:
            transfer_date = date(year, month, 15)
            if transfer_date <= today:
                txns.append(Transaction(
                    user_id=user_id,
                    amount=random.randint(500, 1500),
                    category="تحويل وارد",
                    type="income",
                    description="تحويل من أحمد القرني",
                    transaction_date=transfer_date
                ))
                
    db.add_all(txns)
    await db.commit()
    print("Database seeding completed successfully! Add 1 user, 6 budgets, 2 savings goals, 2 financial goals, and ~120 transactions.")
