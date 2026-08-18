# Shared Package Contract

This product consumes the central `@softwall/platform-contracts` package from `softwall-business-os`.

Contract: `2026-08-18.v1`

Required platform boundaries: tenant context, versioned events, entitlement checks, authenticated API calls, and correlation/request IDs. Product code must not bypass platform authorization or access another product's database directly.

When the product runtime is initialized, pin the published/approved package version rather than consuming an unpinned branch.
