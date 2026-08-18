import { BadRequestException, Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PaystackService } from './paystack.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService, private readonly stripe: StripeService, private readonly paystack: PaystackService) {}

  @Post('quote')
  quote(@Body() body: { plan: string; users: number }) { return this.billing.quote(body.plan, body.users); }

  @Post('stripe/checkout')
  stripeCheckout(@Body() body: { customerId?: string; priceId: string; organizationId: string; plan: string; seats: number }) {
    return this.stripe.createCheckoutSession(body);
  }

  @Post('stripe/portal')
  stripePortal(@Body() body: { customerId: string }) { return this.stripe.createPortalSession(body.customerId); }

  @Post('stripe/webhook')
  async stripeWebhook(@Req() request: Request, @Headers('stripe-signature') signature: string) {
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !signature) throw new BadRequestException('Stripe raw body/signature is required');
    const event = this.stripe.constructWebhookEvent(rawBody, signature);
    if (!(await this.billing.recordEvent('stripe', event.id))) return { received: true, duplicate: true };

    const obj = event.data.object as any;
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const metadata = obj.metadata ?? {};
      if (metadata.organizationId) {
        const status = obj.status === 'active' ? 'ACTIVE' : obj.status === 'past_due' ? 'PAST_DUE' : obj.status === 'canceled' ? 'CANCELED' : 'INCOMPLETE';
        await this.billing.syncSubscription({ organizationId: metadata.organizationId, provider: 'stripe', customerId: String(obj.customer), subscriptionId: String(obj.id), plan: metadata.plan ?? 'starter', seats: Number(metadata.seats ?? 1), status, currentPeriodEnd: obj.current_period_end ? new Date(Number(obj.current_period_end) * 1000) : undefined });
        await this.billing.audit(metadata.organizationId, `stripe.${event.type}`, { subscriptionId: obj.id, status });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      await this.billing.setProviderSubscriptionStatus('stripe', String(obj.id), 'CANCELED');
    } else if (event.type === 'invoice.payment_failed' && obj.subscription) {
      await this.billing.setProviderSubscriptionStatus('stripe', String(obj.subscription), 'PAST_DUE');
    }
    return { received: true, type: event.type };
  }

  @Post('paystack/initialize')
  paystackInitialize(@Body() body: { email: string; amountKobo: number; planCode?: string; organizationId: string; plan: string; seats: number }) {
    return this.paystack.initializeTransaction(body);
  }

  @Post('paystack/subscribe')
  paystackSubscribe(@Body() body: { customer: string; plan: string }) { return this.paystack.createSubscription(body.customer, body.plan); }

  @Post('paystack/webhook')
  async paystackWebhook(@Req() request: Request, @Headers('x-paystack-signature') signature: string) {
    const payload = JSON.stringify(request.body);
    const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '').update(payload).digest('hex');
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return { received: false };

    const event = request.body as any;
    const eventId = String(event.data?.id ?? event.data?.reference ?? event.data?.subscription_code ?? `${event.event}:${event.data?.customer?.customer_code ?? ''}`);
    if (!(await this.billing.recordEvent('paystack', eventId))) return { received: true, duplicate: true };

    const data = event.data ?? {};
    const metadata = typeof data.metadata === 'object' ? data.metadata : {};
    const organizationId = metadata.organizationId;
    if (organizationId && ['charge.success', 'subscription.create'].includes(event.event)) {
      await this.billing.syncSubscription({ organizationId, provider: 'paystack', customerId: String(data.customer?.customer_code ?? data.customer ?? ''), subscriptionId: String(data.subscription_code ?? data.subscription?.subscription_code ?? data.id ?? ''), plan: metadata.plan ?? 'starter', seats: Number(metadata.seats ?? 1), status: 'ACTIVE', currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : undefined });
      await this.billing.audit(organizationId, `paystack.${event.event}`, { reference: data.reference, subscriptionCode: data.subscription_code });
    } else if (event.event === 'invoice.payment_failed' && data.subscription_code) {
      await this.billing.setProviderSubscriptionStatus('paystack', String(data.subscription_code), 'PAST_DUE');
    } else if (event.event === 'subscription.disable' && data.subscription_code) {
      await this.billing.setProviderSubscriptionStatus('paystack', String(data.subscription_code), 'CANCELED');
    }
    return { received: true, event: event.event };
  }
}
