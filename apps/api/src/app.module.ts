import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PayrollModule } from './payroll/payroll.module';
import { BillingModule } from './billing/billing.module';
import { AiModule } from './ai/ai.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, PayrollModule, BillingModule, AiModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
