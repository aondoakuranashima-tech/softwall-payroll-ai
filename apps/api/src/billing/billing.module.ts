import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PaystackService } from './paystack.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, PaystackService],
  exports: [BillingService, StripeService, PaystackService],
})
export class BillingModule {}
