# Softwall Platform Integration

This product is part of the Softwall 25-product ecosystem and must consume the shared `softwall-business-os` platform for cross-product capabilities.

## Required platform capabilities
- Identity and authentication (passwords, MFA, passkeys/WebAuthn; device biometrics stay on the OS/device).
- Organization and tenant context.
- RBAC/ABAC authorization enforced server-side.
- Shared security controls and audit events.
- Softwall Billing entitlements and subscription state; never implement provider-specific billing logic as product truth.
- AI Core for governed model/agent access.
- Documents where the product needs file processing.
- Notifications through the shared notification contract.
- Versioned events for asynchronous integration.
- Standard logs, metrics, traces, and audit telemetry.

## Product boundary
Product-specific business logic and data remain owned by this repository. Do not access another product's database directly. Integrate through authenticated APIs and versioned events.

## Security rules
Never commit secrets, credentials, production customer data, biometric templates, or payment credentials. All tenant-sensitive operations must be authorization-checked server-side and observable.
