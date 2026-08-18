import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PaystackService {
  private readonly api: AxiosInstance = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
  });

  async initializeTransaction(input: {
    email: string;
    amountKobo: number;
    planCode?: string;
    organizationId: string;
    plan: string;
    seats: number;
  }) {
    const { data } = await this.api.post('/transaction/initialize', {
      email: input.email,
      amount: input.amountKobo,
      ...(input.planCode ? { plan: input.planCode } : {}),
      metadata: {
        organizationId: input.organizationId,
        plan: input.plan,
        seats: input.seats,
      },
      callback_url: `${process.env.APP_URL}/billing/paystack/callback`,
    });
    return data;
  }

  async createSubscription(customer: string, plan: string) {
    const { data } = await this.api.post('/subscription', { customer, plan });
    return data;
  }
}
