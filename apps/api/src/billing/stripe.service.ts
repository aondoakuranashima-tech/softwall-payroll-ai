import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

  async createCheckoutSession(input: {
    customerId?: string;
    priceId: string;
    organizationId: string;
    plan: string;
    seats: number;
  }) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: input.customerId,
      line_items: [{ price: input.priceId, quantity: input.seats }],
      metadata: {
        organizationId: input.organizationId,
        plan: input.plan,
        seats: String(input.seats),
      },
      subscription_data: {
        metadata: {
          organizationId: input.organizationId,
          plan: input.plan,
          seats: String(input.seats),
        },
      },
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing`,
    });
  }

  async createPortalSession(customerId: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/billing`,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );
  }
}
