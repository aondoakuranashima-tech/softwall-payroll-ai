import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

  async createCheckoutSession(customerId: string | undefined, priceId: string) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
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
