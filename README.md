<div align="center">

<img src="artifacts/siraj/src/assets/LOGO-SIRAJ.png" alt="سراج" width="100"/>

# سِراج — Siraj Financial AI

**وكيل مالي ذكي للسوق السعودي**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[🚀 تجربة مباشرة](#-تشغيل-المشروع) • [📸 لقطات الشاشة](#-لقطات-الشاشة) • [🔌 API](#-api-docs) • [🤝 المساهمة](#-المساهمة)

</div>

---

## 📖 نبذة عن المشروع

**سراج** هو منصة متكاملة لإدارة الصحة المالية الشخصية، مدعومة بمساعد ذكاء اصطناعي يتحدث العربية ومتخصص في السوق السعودي. يساعدك سراج على تتبع إنفاقك، تخطيط مدخراتك، اتخاذ قرارات استثمارية واعية — كل ذلك في واجهة عربية أنيقة وسهلة الاستخدام.

> **مشروع هاكاثون** — بُني بالكامل بـ React + FastAPI

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|--------|
| 📊 **لوحة التحكم** | نظرة شاملة على الوضع المالي: الدخل، الإنفاق، مؤشر الصحة المالية، ونصيحة يومية |
| 💳 **المعاملات** | تتبع وتصنيف جميع معاملاتك المالية مع تحليل بصري |
| 🤖 **سراج AI** | محادثة مع مساعد مالي ذكي يجيب بالعربية ويفهم سياقك المالي |
| 💰 **التمويل** | استعراض وتقديم طلبات التمويل الشخصي والتجاري |
| 📈 **الاستثمار** | فرص استثمارية إسلامية مُرشَّحة بناءً على ملفك المالي |
| 🏦 **المدخرات** | خطط ادخار ذكية مع تتبع التقدم |
| 🎯 **الأهداف** | حدّد أهدافاً مالية واحصل على خطة تفصيلية لتحقيقها |
| 🔔 **التنبيهات** | إشعارات استباقية عند تجاوز الميزانية أو اقتراب الأهداف |
| 📑 **التقارير** | تقارير مالية تفصيلية بمخططات بيانية تفاعلية |
| 🔒 **الأمان** | مراقبة أمنية للحساب وإدارة الجلسات |

---

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
- **React 19** + **Vite 7** — بنية سريعة وحديثة
- **react-router-dom v7** — التنقل بين الصفحات
- **Recharts** — مخططات بيانية تفاعلية
- **Axios** — التواصل مع الـ API
- **Lucide React** — أيقونات أنيقة
- **خط Cairo** — خط عربي احترافي
- تصميم RTL كامل مع دعم الوضع المظلم والمضيء

### الخادم الخلفي (Backend)
- **FastAPI** — إطار عمل Python سريع وحديث
- **SQLAlchemy 2** + **aiosqlite** — قاعدة بيانات غير متزامنة
- **Pydantic v2** — التحقق من البيانات
- **python-jose** + **passlib** — المصادقة بـ JWT
- **OpenAI API** — ذكاء اصطناعي (مع رسالة احتياطية عربية عند الغياب)

### البنية التحتية
- **pnpm Workspaces** — إدارة المشروع كـ monorepo
- **SQLite** — قاعدة بيانات خفيفة (قابلة للترقية إلى PostgreSQL)

---

## 📸 لقطات الشاشة

<div align="center">
<table>
<tr>
<td align="center"><b>تسجيل الدخول</b></td>
<td align="center"><b>لوحة التحكم</b></td>
</tr>
<tr>
<td><img src="artifacts/siraj/src/assets/LOGO-SIRAJ.png" width="300" alt="Login"/></td>
<td><img src="artifacts/siraj/src/assets/LOGO-SIRAJ.png" width="300" alt="Dashboard"/></td>
</tr>
</table>
</div>

---

## 🚀 تشغيل المشروع

### المتطلبات
- **Node.js 20+** و **pnpm 10+**
- **Python 3.11+**

### خطوات التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/almutairithayib/siraj-advanced.git
cd siraj-advanced

# 2. تثبيت حزم Node.js
pnpm install

# 3. تثبيت حزم Python
pip install -r artifacts/siraj/backend/requirements.txt

# 4. تشغيل الواجهة الأمامية (المنفذ 5173)
pnpm --filter @workspace/siraj run dev

# 5. تشغيل الخادم الخلفي (المنفذ 8001) — في terminal منفصل
cd artifacts/siraj
python -m uvicorn backend.app.main:app --reload --port 8001
```

### متغيرات البيئة (اختيارية)

أنشئ ملف `artifacts/siraj/backend/.env`:

```env
# مفتاح OpenAI لتفعيل المساعد الذكي (اختياري — يعمل بدونه)
OPENAI_API_KEY=sk-...

# سر JWT (يُولَّد تلقائياً إن لم يُحدَّد)
SESSION_SECRET=your-secret-key

# مسار قاعدة البيانات
SIRAJ_DATABASE_URL=sqlite+aiosqlite:///./siraj.db
```

### حساب تجريبي

بعد تشغيل الخادم، قاعدة البيانات تُعبَّأ تلقائياً بـ:

| الحقل | القيمة |
|-------|--------|
| البريد الإلكتروني | `sara@siraj.sa` |
| كلمة المرور | `12345678` |

---

## 🔌 API Docs

بعد تشغيل الخادم، توجه إلى:

- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### نقاط النهاية الرئيسية

```
POST   /api/v1/auth/login          — تسجيل الدخول
GET    /api/v1/dashboard/overview  — ملخص الوضع المالي
GET    /api/v1/dashboard/health-score — مؤشر الصحة المالية
GET    /api/v1/transactions        — قائمة المعاملات
POST   /api/v1/transactions        — إضافة معاملة
GET    /api/v1/budgets             — الميزانيات
GET    /api/v1/savings             — خطط الادخار
GET    /api/v1/goals               — الأهداف المالية
POST   /api/v1/chat/sessions       — جلسة محادثة مع AI
POST   /api/v1/chat/sessions/{id}/messages — إرسال رسالة للـ AI
```

---

## 🏗️ بنية المشروع

```
siraj-advanced/
├── artifacts/
│   └── siraj/
│       ├── src/                    # React frontend
│       │   ├── pages/              # صفحات التطبيق
│       │   ├── components/         # مكونات قابلة للإعادة
│       │   │   ├── Dashboard/      # مكونات لوحة التحكم
│       │   │   └── Layout/         # AppLayout, TopBar, BottomNav
│       │   ├── context/            # React Context (Auth, Theme, Alerts...)
│       │   ├── hooks/              # Custom hooks
│       │   └── api/client.js       # Axios client
│       ├── backend/                # FastAPI backend
│       │   └── app/
│       │       ├── routers/        # نقاط النهاية (auth, dashboard, chat...)
│       │       ├── models/         # SQLAlchemy models
│       │       ├── schemas/        # Pydantic schemas
│       │       ├── services/       # Business logic
│       │       └── ai/             # AI provider & agent loop
│       └── start-backend.sh        # سكريبت تشغيل الخادم
└── pnpm-workspace.yaml
```

---

## 🤝 المساهمة

المساهمات مرحب بها! للمساهمة:

1. Fork المشروع
2. أنشئ فرعاً جديداً: `git checkout -b feature/amazing-feature`
3. اعمل تغييراتك وأضفها: `git commit -m 'feat: إضافة ميزة رائعة'`
4. ادفع إلى الفرع: `git push origin feature/amazing-feature`
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT — راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

<div align="center">

صُنع بـ ❤️ للسوق السعودي

**سراج** — يُنير طريقك المالي 💡

</div>
