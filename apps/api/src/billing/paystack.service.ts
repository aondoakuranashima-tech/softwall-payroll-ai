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

  async initializeTransaction(email: string, amountKobo: number, planCode?: string) {
    const { data } = await this.api.post('/transaction/initialize', {
      email,
      amount: amountKobo,
      ...(planCode ? { plan: planCode } : {}),
      callback_url: `${process.env.APP_URL}/billing/paystack/callback`,
    });
    return data;
  }

  async createSubscription(customer: string, plan: string) {
    const { data } = await this.api.post('/subscription', { customer, plan });
    return data;
  }
}
