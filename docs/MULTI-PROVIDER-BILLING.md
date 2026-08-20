# Payroll AI Multi-Provider Billing

Payroll AI uses one billing abstraction with five providers:

- Paystack
- Flutterwave
- Dodo Payments
- Paddle
- PayPal

Gift cards are not supported.

## Checkout

`POST /api/billing/checkout`

```json
{
  "provider": "paystack",
  "email": "customer@example.com",
  "amount": 99,
  "currency": "NGN",
  "organizationId": "org_id",
  "plan": "business",
  "seats": 10,
  "billingCycle": "monthly",
  "paymentMethod": "card"
}
```

Provider selection can be discovered with:

`GET /api/billing/providers?country=NG&currency=NGN&method=card`

The server returns a hosted checkout URL. Provider credentials never go to the client.

## Environment secrets

```text
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_CURRENCY=NGN

FLW_SECRET_KEY=
FLW_WEBHOOK_SECRET=

DODO_PAYMENTS_API_KEY=
DODO_DEFAULT_PRODUCT_ID=
DODO_WEBHOOK_SECRET=
DODO_API_BASE_URL=https://live.dodopayments.com

PADDLE_API_KEY=
PADDLE_MONTHLY_PRICE_ID=
PADDLE_ANNUAL_PRICE_ID=
PADDLE_WEBHOOK_SECRET=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE_URL=https://api-m.paypal.com
PAYPAL_WEBHOOK_ID=

APP_URL=https://YOUR-PAYROLL-AI-DOMAIN.example
```

## Webhooks

- `/api/billing/paystack/webhook`
- `/api/billing/flutterwave/webhook`
- `/api/billing/dodo/webhook`
- `/api/billing/paddle/webhook`
- `/api/billing/paypal/webhook`

Webhook events are recorded through the existing Prisma `BillingEvent` unique constraint before subscription state is changed. Do not activate paid access from browser redirects alone.

## Provider routing

Paystack is prioritized for Nigeria/local NGN flows. Flutterwave and Dodo are available for broader coverage. Paddle is treated as a global SaaS checkout and is excluded from NGN routing in this implementation. PayPal is exposed for PayPal/card-compatible requests.

Actual payment methods depend on the provider account, customer country, currency and provider configuration; the application must not claim universal support for cards, bank payments, wallets, Apple Pay, Google Pay, USSD or mobile money unless the selected provider actually exposes them for that transaction.

## Production requirement

The database already has `BillingEvent` uniqueness and subscription persistence. Before enabling live payments, configure all webhook endpoints over HTTPS, verify provider-specific webhook signatures, run test-mode transactions, and add provider reconciliation/ledger records for settlement reporting.
