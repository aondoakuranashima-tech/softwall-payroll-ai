import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PaystackService } from './paystack.service';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly stripe: StripeService,
    private readonly paystack: PaystackService,
  ) {}

  @Post('quote')
  quote(@Body() body: { plan: string; users: number }) {
    return this.billing.quote(body.plan, body.users);
  }

  @Post('stripe/checkout')
  stripeCheckout(@Body() body: { customerId?: string; priceId: string }) {
    return this.stripe.createCheckoutSession(body.customerId, body.priceId);
  }

  @Post('stripe/portal')
  stripePortal(@Body() body: { customerId: string }) {
    return this.stripe.createPortalSession(body.customerId);
  }

  @Post('stripe/webhook')
  stripeWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripe.constructWebhookEvent(
      request.body as Buffer,
      signature,
    );
    return { received: true, type: event.type };
  }

  @Post('paystack/initialize')
  paystackInitialize(@Body() body: { email: string; amountKobo: number; planCode?: string }) {
    return this.paystack.initializeTransaction(body.email, body.amountKobo, body.planCode);
  }

  @Post('paystack/subscribe')
  paystackSubscribe(@Body() body: { customer: string; plan: string }) {
    return this.paystack.createSubscription(body.customer, body.plan);
  }

  @Post('paystack/webhook')
  paystackWebhook(
    @Req() request: Request,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const payload = JSON.stringify(request.body);
    const expected = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
      .update(payload)
      .digest('hex');

    if (!signature || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return { received: false };
    }

    return { received: true, event: (request.body as { event?: string }).event };
  }
}
