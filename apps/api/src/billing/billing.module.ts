import { Module } from '@nestjs/common';
import { MultiProviderBillingController } from './multi-provider.controller';
import { BillingService } from './billing.service';
import { MultiProviderBillingService } from './multi-provider.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MultiProviderBillingController],
  providers: [BillingService, MultiProviderBillingService, PrismaService],
  exports: [BillingService, MultiProviderBillingService],
})
export class BillingModule {}
