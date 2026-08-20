import { BadRequestException, Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { MultiProviderBillingService, PaymentProvider, PAYMENT_PROVIDERS } from './multi-provider.service';

@Controller('billing')
export class MultiProviderBillingController {
  constructor(private readonly billing: BillingService, private readonly payments: MultiProviderBillingService) {}

  @Post('quote') quote(@Body() body: { plan: string; users: number }) { return this.billing.quote(body.plan, body.users); }
  @Get('providers') providers(@Query('country') country = 'NG', @Query('currency') currency = 'USD', @Query('method') method = '') { return { providers: this.payments.providers(country, currency, method), all: PAYMENT_PROVIDERS }; }
  @Post('checkout') checkout(@Body() body: { provider: PaymentProvider; email: string; amount: number; currency: string; organizationId: string; plan: string; seats: number; billingCycle: 'monthly' | 'annual'; paymentMethod?: string }) { if (!PAYMENT_PROVIDERS.includes(body.provider)) throw new BadRequestException('Unsupported payment provider'); return this.payments.checkout(body); }
  @Post('paystack/initialize') paystackInitialize(@Body() body: { email: string; amountKobo: number; organizationId: string; plan: string; seats: number }) { return this.payments.checkout({ provider: 'paystack', email: body.email, amount: body.amountKobo / 100, currency: process.env.PAYSTACK_CURRENCY || 'NGN', organizationId: body.organizationId, plan: body.plan, seats: body.seats, billingCycle: 'monthly' }); }

  @Post('paystack/webhook') async paystackWebhook(@Req() request: Request, @Headers('x-paystack-signature') signature: string) { const raw = (request as Request & { rawBody?: Buffer }).rawBody; if (!raw || !this.payments.verifyPaystack(raw, signature)) throw new BadRequestException('Invalid Paystack signature'); return this.processWebhook('paystack', request.body); }
  @Post('flutterwave/webhook') async flutterwaveWebhook(@Req() request: Request, @Headers('verif-hash') signature: string) { if (!this.payments.verifyFlutterwave(signature)) throw new BadRequestException('Invalid Flutterwave signature'); return this.processWebhook('flutterwave', request.body); }
  @Post('dodo/webhook') async dodoWebhook(@Req() request: Request, @Headers('webhook-signature') signature: string) { const raw = (request as Request & { rawBody?: Buffer }).rawBody; if (process.env.DODO_WEBHOOK_SECRET && (!raw || !this.payments.verifyDodo(raw, signature))) throw new BadRequestException('Invalid Dodo signature'); return this.processWebhook('dodo', request.body); }
  @Post('paddle/webhook') async paddleWebhook(@Req() request: Request, @Headers('paddle-signature') signature: string) { const raw = (request as Request & { rawBody?: Buffer }).rawBody; if (process.env.PADDLE_WEBHOOK_SECRET && (!raw || !this.payments.verifyPaddle(raw, signature))) throw new BadRequestException('Invalid Paddle signature'); return this.processWebhook('paddle', request.body); }
  @Post('paypal/webhook') async paypalWebhook(@Req() request: Request) { if (process.env.PAYPAL_WEBHOOK_ID && !request.headers['paypal-transmission-id']) throw new BadRequestException('Missing PayPal transmission headers'); return this.processWebhook('paypal', request.body); }

  private async processWebhook(provider: string, event: any) {
    const eventId = String(event.id ?? event.event_id ?? event.data?.id ?? event.data?.reference ?? `${event.event ?? 'event'}:${event.data?.subscription_code ?? ''}`);
    if (!(await this.billing.recordEvent(provider, eventId))) return { received: true, duplicate: true };
    const data = event.data ?? event; const metadata = typeof data.metadata === 'object' ? data.metadata : typeof data.meta === 'object' ? data.meta : typeof data.custom_data === 'object' ? data.custom_data : {}; const organizationId = metadata.organizationId;
    if (organizationId) {
      const state = String(event.event ?? event.type ?? data.status ?? '').toLowerCase(); const subscriptionId = String(data.subscription_code ?? data.subscription_id ?? data.subscriptionId ?? data.id ?? '');
      if (['charge.success','subscription.create','completed','paid','transaction.completed','subscription.activated','payment_succeeded'].includes(state)) await this.billing.syncSubscription({ organizationId, provider, customerId: String(data.customer?.customer_code ?? data.customer_id ?? data.customerId ?? ''), subscriptionId, plan: metadata.plan ?? 'starter', seats: Number(metadata.seats ?? 1), status: 'ACTIVE', currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : undefined });
      else if (['invoice.payment_failed','past_due','payment_failed'].includes(state) && subscriptionId) await this.billing.setProviderSubscriptionStatus(provider, subscriptionId, 'PAST_DUE');
      else if (['subscription.disable','canceled','cancelled'].includes(state) && subscriptionId) await this.billing.setProviderSubscriptionStatus(provider, subscriptionId, 'CANCELED');
      await this.billing.audit(organizationId, `${provider}.${state || 'webhook'}`, { eventId, subscriptionId });
    }
    return { received: true, provider, eventId };
  }
}
