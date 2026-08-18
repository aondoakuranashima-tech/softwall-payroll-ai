import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const PLANS: Record<string, { base: number; perUser: number }> = {
  starter: { base: 29, perUser: 3 },
  business: { base: 99, perUser: 5 },
  enterprise: { base: 499, perUser: 8 },
};

type Status = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  quote(plan: string, users: number) {
    const p = PLANS[plan] ?? PLANS.starter;
    const seats = Math.max(1, Math.floor(users));
    return { plan, seats, monthly: p.base + p.perUser * seats, baseMonthly: p.base, perUserMonthly: p.perUser, currency: 'USD', providers: ['stripe', 'paystack'] };
  }

  async recordEvent(provider: string, eventId: string): Promise<boolean> {
    try {
      await this.prisma.billingEvent.create({ data: { provider, eventId } });
      return true;
    } catch {
      return false;
    }
  }

  async syncSubscription(input: { organizationId: string; provider: string; customerId?: string; subscriptionId?: string; plan: string; seats?: number; status: Status; currentPeriodEnd?: Date }) {
    const p = PLANS[input.plan] ?? PLANS.starter;
    const seats = Math.max(1, Math.floor(input.seats ?? 1));
    const existing = await this.prisma.subscription.findFirst({ where: { organizationId: input.organizationId, provider: input.provider } });
    const data = {
      provider: input.provider,
      providerCustomerId: input.customerId,
      providerSubscriptionId: input.subscriptionId,
      plan: input.plan,
      seats,
      status: input.status,
      monthlyBaseCents: Math.round(p.base * 100),
      monthlyPerUserCents: Math.round(p.perUser * 100),
      currentPeriodEnd: input.currentPeriodEnd,
    };
    if (existing) return this.prisma.subscription.update({ where: { id: existing.id }, data });
    return this.prisma.subscription.create({ data: { organizationId: input.organizationId, ...data } });
  }

  async setProviderSubscriptionStatus(provider: string, subscriptionId: string, status: Status) {
    return this.prisma.subscription.updateMany({ where: { provider, providerSubscriptionId: subscriptionId }, data: { status } });
  }

  async audit(organizationId: string, action: string, metadata: unknown) {
    return this.prisma.auditLog.create({ data: { organizationId, action, entity: 'Subscription', metadata: metadata as object } });
  }
}
