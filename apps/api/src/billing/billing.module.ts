import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MultiProviderBillingService } from './multi-provider.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, MultiProviderBillingService, PrismaService],
  exports: [BillingService, MultiProviderBillingService],
})
export class BillingModule {}
