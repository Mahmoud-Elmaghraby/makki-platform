# Makki Platform — Monorepo

منصة مكي القانونية المتكاملة (موقع تعريفي + LMS + استشارات قانونية)

## البنية

```
makki-platform/
  apps/
    frontend/   → React + Vite + TS + Tailwind v4 (الموقع التعريفي حاليًا، هيتضاف عليه LMS/الداشبورد لاحقًا)
    api/        → NestJS (Modular Monolith) — modules: auth, courses, consulting, payments, cms
  packages/     → (فاضية دلوقتي، لمشاركة كود بين apps لاحقًا: types، ui components، إلخ)
```

## التشغيل محليًا

```bash
pnpm install         # من جذر المشروع، هيثبت كل الـ apps
pnpm dev             # يشغل كل الـ apps بالتوازي عبر turborepo

# أو كل app لوحده:
cd apps/frontend && pnpm dev     # http://localhost:5173
cd apps/api && pnpm run start:dev
```

## قرارات معمارية ثابتة

- Backend: Modular Monolith (NestJS) — مش microservices، عشان حجم الفريق والمرحلة الحالية
- Frontend: React SPA واحد (مش Next.js) — الصفحات التعريفية هيتضاف لها pre-rendering لاحقًا (حل هجين) لمعالجة الـ SEO
- راجع `/mnt/user-data/outputs/makki-docs/02-master-document.md` لباقي القرارات الثابتة
