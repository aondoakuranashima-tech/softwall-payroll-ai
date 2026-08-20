import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionStatus } from '@prisma/client';

const PLANS: Record<string, { base: number; perUser: number }> = { starter: { base: 29, perUser: 3 }, business: { base: 99, perUser: 5 }, enterprise: { base: 499, perUser: 8 } };
const PROVIDERS = ['paystack', 'flutterwave', 'dodo', 'paddle', 'paypal'];

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}
  quote(plan: string, users: number) { const selected = PLANS[plan] ?? PLANS.starter; const seats = Math.max(1, Math.floor(users)); return { plan, seats, monthly: selected.base + selected.perUser * seats, baseMonthly: selected.base, perUserMonthly: selected.perUser, currency: 'USD', providers: PROVIDERS }; }
  async recordEvent(provider: string, eventId: string): Promise<boolean> { try { await this.prisma.billingEvent.create({ data: { provider, eventId } }); return true; } catch { return false; } }
  async syncSubscription(input: { organizationId: string; provider: string; customerId?: string; subscriptionId?: string; plan: string; seats?: number; status: SubscriptionStatus; currentPeriodEnd?: Date }) {
    const organization = await this.prisma.organization.findUnique({ where: { id: input.organizationId }, select: { id: true } }); if (!organization) throw new NotFoundException('Softwall organization not found');
    const selected = PLANS[input.plan] ?? PLANS.starter; const seats = Math.max(1, Math.floor(input.seats ?? 1));
    const data = { provider: input.provider, providerCustomerId: input.customerId, providerSubscriptionId: input.subscriptionId, plan: input.plan, seats, status: input.status, monthlyBaseCents: Math.round(selected.base * 100), monthlyPerUserCents: Math.round(selected.perUser * 100), currentPeriodEnd: input.currentPeriodEnd };
    const existing = await this.prisma.subscription.findFirst({ where: { organizationId: input.organizationId, provider: input.provider } }); if (existing) return this.prisma.subscription.update({ where: { id: existing.id }, data });
    return this.prisma.subscription.create({ data: { organization: { connect: { id: input.organizationId } }, ...data } });
  }
  async setProviderSubscriptionStatus(provider: string, subscriptionId: string, status: SubscriptionStatus) { return this.prisma.subscription.updateMany({ where: { provider, providerSubscriptionId: subscriptionId }, data: { status } }); }
  async audit(organizationId: string, action: string, metadata: Record<string, unknown>) { return this.prisma.auditLog.create({ data: { organizationId, action, entity: 'Subscription', metadata: JSON.stringify(metadata) } }); }
}
