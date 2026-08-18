# Softwall Payroll AI

Enterprise payroll SaaS foundation: Next.js web, NestJS API, Expo mobile, Prisma/PostgreSQL, RBAC, AI assistant, Stripe/Paystack adapters, and Docker.

## Monorepo
- `apps/web` — website and web application
- `apps/api` — NestJS backend and Prisma schema
- `apps/mobile` — Expo/React Native mobile app
- `packages/shared` — shared package
- `docs` — architecture and billing documentation

## Security
Never commit `.env` files or live payment/API secrets. Use `.env.example` as the safe template.
