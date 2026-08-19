import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe?: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) this.stripe = new Stripe(key);
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe billing is disabled. Configure STRIPE_SECRET_KEY to enable it.');
    }
    return this.stripe;
  }

  async createCheckoutSession(input: {
    customerId?: string;
    priceId: string;
    organizationId: string;
    plan: string;
    seats: number;
  }) {
    const stripe = this.requireStripe();
    return stripe.checkout.sessions.create({
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
    const stripe = this.requireStripe();
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/billing`,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhooks are disabled. Configure STRIPE_WEBHOOK_SECRET to enable them.');
    }
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
