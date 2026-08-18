# Softwall Configuration Contract

Capability #3 uses the central `@softwall/config` contract from `softwall-business-os`.

Required runtime values: `SOFTWALL_APP_NAME`, `SOFTWALL_API_BASE_URL`.
Optional infrastructure values: `DATABASE_URL`, `REDIS_URL`.
Supported environments: development, test, staging, production.

Secrets must be supplied through the deployment secret manager and must never be committed to Git.
