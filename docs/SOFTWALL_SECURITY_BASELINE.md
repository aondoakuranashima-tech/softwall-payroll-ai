# Softwall Business OS Security Baseline

## Threat model

Protect against:
- cross-tenant data access
- privilege escalation
- stolen sessions/tokens
- webhook replay
- payment manipulation
- malicious file uploads
- prompt injection and tool abuse
- insecure exports
- supply-chain compromise
- accidental secret exposure
- denial of service

## Required controls

### Authentication
- MFA for administrators and finance/payroll approvers
- passkeys where supported
- short-lived access tokens
- refresh-token rotation and revocation
- session/device inventory
- brute-force and credential-stuffing protection

### Authorization
- centralized permission catalog
- deny-by-default policy evaluation
- tenant and resource scope checks
- separation of duties
- approval workflows for payroll, payments, refunds and exports
- service-to-service authentication

### Data
- tenant-scoped repositories
- PostgreSQL constraints and indexes
- optional Row Level Security for high-assurance tenants
- encrypted sensitive fields where justified
- signed URLs with short expiry for private files
- malware/content scanning for uploads
- retention and deletion policies

### API
- schema validation on every input
- strict CORS
- security headers
- rate limits per user, tenant and IP
- idempotency for mutations involving money or external systems
- request IDs and distributed tracing
- standardized error responses without secret leakage

### Webhooks
- verify provider signatures before parsing events
- persist provider event IDs
- unique constraint on provider + event ID
- reject stale/replayed events where provider semantics allow
- process asynchronously after validation

### AI
- no unrestricted SQL/database tools
- allow-listed typed tools
- tool-level authorization
- prompt/data isolation by tenant
- PII minimization
- output validation for structured actions
- human approval for high-impact financial/security actions
- AI action audit trail
- model/provider failover without exposing secrets
- prompt-injection-resistant retrieval boundaries

### Supply chain
- lockfile enforcement
- dependency update automation
- secret scanning
- SAST and dependency vulnerability scanning
- container scanning
- signed/reproducible production artifacts where practical

## Security maturity roadmap

### Level 1 — MVP
Tenant isolation, RBAC, secure auth, audit logs, webhook verification, rate limiting, secrets hygiene.

### Level 2 — Production
MFA, session controls, security events, centralized authorization, encrypted sensitive fields, automated scanning, backups and restore testing.

### Level 3 — Enterprise
SSO/SAML/OIDC, SCIM, advanced audit exports, customer-managed policies, stronger data isolation options, security dashboards and formal incident response.

### Level 4 — Compliance
SOC 2 / ISO 27001 control mapping, evidence collection, continuous control monitoring, formal disaster recovery and penetration testing.
