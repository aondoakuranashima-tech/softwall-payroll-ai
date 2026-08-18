import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PaystackService } from './paystack.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, PaystackService, PrismaService],
  exports: [BillingService, StripeService, PaystackService],
})
export class BillingModule {}
