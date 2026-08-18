# Softwall Business OS Architecture

## Goal

Evolve the existing Softwall Payroll architecture into a secure, multi-tenant AI-native Business OS that can host the 18 additional SaaS modules without creating 18 separate platforms.

## Existing foundation

The Payroll system already establishes the core monorepo pattern:
- `apps/web` for the web product
- `apps/api` for the NestJS API
- `apps/mobile` for mobile
- PostgreSQL + Prisma
- organization-scoped data
- RBAC
- billing with Stripe and Paystack
- AI module
- Docker and GitHub Actions

The Business OS preserves these strengths while moving shared capabilities into platform services.

## Target topology

```text
Softwall Business OS
├── apps/
│   ├── web/                 # unified web console
│   ├── mobile/              # unified mobile application
│   ├── api/                 # public API / BFF
│   ├── worker/              # asynchronous jobs
│   └── ai-gateway/          # model routing, policy, tool execution
│
├── packages/
│   ├── core/                # organization, users, tenancy, RBAC
│   ├── security/            # authz, policy, audit, risk controls
│   ├── billing/             # plans, entitlements, Stripe/Paystack
│   ├── events/              # domain events and idempotency
│   ├── ai/                  # agents, tools, guardrails, evaluation
│   ├── data/                # Prisma client, repositories, data policy
│   ├── observability/       # logs, traces, metrics, security events
│   ├── notifications/       # email, SMS, push, in-app
│   └── integrations/        # banks, payments, accounting, CRM APIs
│
├── modules/
│   ├── payroll/
│   ├── workforce/
│   ├── finance/
│   ├── invoice/
│   ├── expense/
│   ├── sales/
│   ├── support/
│   ├── contract/
│   ├── compliance/
│   ├── procurement/
│   ├── inventory/
│   ├── projectops/
│   ├── onboard/
│   ├── document/
│   ├── security/
│   ├── customer/
│   ├── marketing/
│   └── it-asset/
│
└── infrastructure/
    ├── database/
    ├── queues/
    ├── object-storage/
    └── deployment/
```

## Shared platform principles

1. **One tenant identity**: every request resolves a server-side organization/tenant context.
2. **Default deny**: authorization is required at API, service, data and action boundaries.
3. **Module isolation**: modules own their business logic but consume platform contracts.
4. **Event-driven integration**: modules communicate through versioned domain events rather than direct table coupling where practical.
5. **Idempotency everywhere money moves**: payment, payroll, invoicing and webhooks require idempotency keys and unique provider event IDs.
6. **AI never bypasses authorization**: AI tools execute through the same policy engine as human actions.
7. **Auditability by design**: sensitive reads, writes, exports, approvals, AI actions and authentication events are auditable.
8. **Progressive extraction**: start as a modular monolith for speed; extract high-load workers/services only when metrics justify it.

## Module composition

Every business module follows the same contract:

```text
module/
├── domain/          # entities, rules, policies
├── application/     # use cases
├── api/             # controllers / DTOs
├── persistence/     # repositories
├── events/          # published/subscribed events
├── ai/              # safe AI tools for the module
└── tests/
```

This makes Payroll the reference implementation instead of a separate architectural island.

## Security architecture

### Identity
- short-lived access tokens
- rotating refresh tokens
- MFA/passkeys for privileged users
- optional enterprise SSO/SAML/OIDC
- device/session management
- step-up authentication for sensitive operations

### Authorization
- organization-scoped RBAC
- permission-level authorization
- resource ownership checks
- policy engine for sensitive actions
- approval workflows for financial operations
- separation of duties

### Data protection
- TLS in transit
- encryption at rest through managed infrastructure
- application-level encryption for especially sensitive fields
- secrets only through environment/secret managers
- no credentials in source control
- strict production CORS and security headers
- database least-privilege roles

### Tenant isolation
- tenant ID required for all business records
- server-derived tenant context; never trust a client-supplied tenant header
- repository layer requires tenant scope
- database constraints/indexes designed around tenant IDs
- optional PostgreSQL Row Level Security for high-assurance deployments

### Audit and detection
- immutable security/audit events
- login and session events
- permission changes
- exports/downloads
- financial changes
- payroll approvals
- billing events
- AI tool executions
- anomaly/risk events

## AI architecture

```text
User / Event
    ↓
AI Gateway
    ↓
Policy + Tenant Context
    ↓
Model Router
    ↓
Agent Planner
    ↓
Approved Tools only
    ↓
Domain Module
    ↓
Audit + Evaluation + Response
```

AI must use allow-listed tools with typed schemas, tenant scope, permission checks, rate limits and audit records. The model should not receive unrestricted database access.

## Business OS intelligence layer

The Intelligence module consumes approved events and analytics from:
- payroll
- HR/workforce
- finance
- invoices
- expenses
- sales
- support
- contracts
- procurement
- inventory
- projects
- compliance

It produces forecasts, alerts, recommendations and executive summaries while keeping source-of-truth data in the owning modules.

## Billing architecture

Use one billing/entitlement service for all modules:
- organization subscription
- plan
- seats/users
- enabled modules
- usage meters
- AI usage
- transaction usage
- provider customer/subscription IDs
- webhook idempotency
- entitlement checks

Stripe and Paystack remain payment adapters, not business-logic owners.

## Deployment model

### Initial
- Vercel for web/API-compatible workloads
- managed PostgreSQL
- managed object storage
- queue/workflow service
- GitHub Actions CI/CD

### Scale path
- dedicated workers for AI, documents and financial processing
- read replicas for analytics
- isolated services for high-risk/high-load domains
- regional deployment where data residency requires it

## Non-negotiable quality gates

Every module must pass:
- typecheck
- unit tests
- integration tests
- authorization tests
- tenant-isolation tests
- webhook idempotency tests where applicable
- dependency/security scanning
- secret scanning
- migration validation
- API contract tests
- production build

## Rollout order

1. Harden Payroll and extract shared platform primitives.
2. Add Workforce, Expense and Invoice.
3. Add Finance and Sales.
4. Add Support and Customer intelligence.
5. Add Contract, Procurement, Compliance and Inventory.
6. Add ProjectOps, Onboard, Document, Security and IT/Asset.
7. Activate Softwall Intelligence across all modules.
8. Package the complete platform as Softwall Business OS.
