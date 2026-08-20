import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

export const PAYMENT_PROVIDERS = ['paystack', 'flutterwave', 'dodo', 'paddle', 'paypal'] as const;
export type PaymentProvider = typeof PAYMENT_PROVIDERS[number];

const plans: Record<string, { base: number; perUser: number; annualDiscount: number }> = {
  starter: { base: 29, perUser: 3, annualDiscount: 10 }, business: { base: 99, perUser: 5, annualDiscount: 15 }, enterprise: { base: 499, perUser: 8, annualDiscount: 20 },
};

@Injectable()
export class MultiProviderBillingService {
  configured(provider: PaymentProvider) {
    return provider === 'paystack' ? !!process.env.PAYSTACK_SECRET_KEY : provider === 'flutterwave' ? !!process.env.FLW_SECRET_KEY : provider === 'dodo' ? !!process.env.DODO_PAYMENTS_API_KEY : provider === 'paddle' ? !!process.env.PADDLE_API_KEY : !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  }

  providers(country = 'NG', currency = 'USD', method = '') {
    const c = country.toUpperCase(); const cur = currency.toUpperCase(); const m = method.toLowerCase();
    return PAYMENT_PROVIDERS.filter((p) => this.configured(p)).filter((p) => {
      if (p === 'paystack') return c === 'NG' || cur === 'NGN' || ['GH', 'KE', 'ZA'].includes(c);
      if (p === 'paddle') return cur !== 'NGN';
      if (p === 'paypal') return !m || m === 'paypal' || m === 'card';
      return true;
    });
  }

  quote(plan: string, users: number) {
    const selected = plans[plan] ?? plans.starter; const seats = Math.max(1, Math.floor(users)); const monthly = selected.base + selected.perUser * seats; const annual = monthly * 12 * (1 - selected.annualDiscount / 100);
    return { plan, seats, currency: 'USD', monthly, annual: Number(annual.toFixed(2)), annualDiscountPercent: selected.annualDiscount, providers: PAYMENT_PROVIDERS };
  }

  private async paypalToken() {
    const base = process.env.PAYPAL_API_BASE_URL || 'https://api-m.paypal.com'; const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const { data } = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }); return { base, token: data.access_token };
  }

  async checkout(input: { provider: PaymentProvider; email: string; amount: number; currency: string; organizationId: string; plan: string; seats: number; billingCycle: 'monthly' | 'annual'; paymentMethod?: string }) {
    if (!this.configured(input.provider)) throw new BadRequestException(`${input.provider} is not configured`);
    const reference = `payrollai_${input.provider}_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
    const metadata = { organizationId: input.organizationId, plan: input.plan, seats: input.seats, billingCycle: input.billingCycle, product: 'Softwall Payroll AI', paymentMethod: input.paymentMethod || '' };
    if (input.provider === 'paystack') {
      const { data } = await axios.post('https://api.paystack.co/transaction/initialize', { email: input.email, amount: Math.round(input.amount * 100), currency: input.currency, reference, metadata, callback_url: `${process.env.APP_URL}/billing/paystack/callback` }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
      return { provider: input.provider, reference, checkoutUrl: data.data.authorization_url, providerId: data.data.access_code };
    }
    if (input.provider === 'flutterwave') {
      const { data } = await axios.post('https://api.flutterwave.com/v3/payments', { tx_ref: reference, amount: input.amount, currency: input.currency, redirect_url: `${process.env.APP_URL}/billing/flutterwave/callback`, customer: { email: input.email }, meta: metadata, customizations: { title: 'Softwall Payroll AI' } }, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
      return { provider: input.provider, reference, checkoutUrl: data.data.link, providerId: reference };
    }
    if (input.provider === 'dodo') {
      const base = process.env.DODO_API_BASE_URL || 'https://live.dodopayments.com'; const { data } = await axios.post(`${base}/checkouts`, { product_cart: [{ product_id: process.env.DODO_DEFAULT_PRODUCT_ID, quantity: 1 }], customer: { email: input.email }, metadata: { payroll_ai_reference: reference, ...metadata } }, { headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`, 'Idempotency-Key': reference } });
      return { provider: input.provider, reference, checkoutUrl: data.checkout_url, providerId: data.session_id };
    }
    if (input.provider === 'paddle') {
      const priceId = input.billingCycle === 'annual' ? process.env.PADDLE_ANNUAL_PRICE_ID : process.env.PADDLE_MONTHLY_PRICE_ID; if (!priceId) throw new BadRequestException('Paddle price ID is not configured');
      const { data } = await axios.post('https://api.paddle.com/transactions', { items: [{ price_id: priceId, quantity: 1 }], custom_data: metadata, collection_mode: 'automatic' }, { headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}`, 'Idempotency-Key': reference } });
      return { provider: input.provider, reference, checkoutUrl: data.data?.checkout?.url, providerId: data.data?.id };
    }
    const { base, token } = await this.paypalToken(); const { data } = await axios.post(`${base}/v2/checkout/orders`, { intent: 'CAPTURE', purchase_units: [{ reference_id: reference, amount: { currency_code: input.currency, value: Number(input.amount).toFixed(2) }, custom_id: reference }] }, { headers: { Authorization: `Bearer ${token}`, 'PayPal-Request-Id': reference } });
    const approval = (data.links || []).find((l: any) => l.rel === 'payer-action' || l.rel === 'approve'); return { provider: input.provider, reference, checkoutUrl: approval?.href, providerId: data.id };
  }

  verifyPaystack(raw: Buffer, signature: string) { return this.verifyHmac(raw, signature, process.env.PAYSTACK_SECRET_KEY || '', 'sha512'); }
  verifyFlutterwave(signature: string) { return !!process.env.FLW_WEBHOOK_SECRET && signature === process.env.FLW_WEBHOOK_SECRET; }
  verifyDodo(raw: Buffer, signature: string) { return this.verifyHmac(raw, signature, process.env.DODO_WEBHOOK_SECRET || '', 'sha256'); }
  verifyPaddle(raw: Buffer, signature: string) {
    const ts = signature.match(/(?:^|;)ts=([^;]+)/)?.[1]; const h1 = signature.match(/(?:^|;)h1=([^;]+)/)?.[1]; if (!ts || !h1 || !process.env.PADDLE_WEBHOOK_SECRET) return false;
    const expected = crypto.createHmac('sha256', process.env.PADDLE_WEBHOOK_SECRET).update(`${ts}:${raw.toString()}`).digest('hex'); return expected.length === h1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
  }
  private verifyHmac(raw: Buffer, signature: string, secret: string, algorithm: 'sha256' | 'sha512') {
    if (!secret || !signature) return false; const expected = crypto.createHmac(algorithm, secret).update(raw).digest('hex'); return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}
