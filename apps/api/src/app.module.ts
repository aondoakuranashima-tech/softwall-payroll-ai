import {Module} from '@nestjs/common'; import {PayrollModule} from './payroll/payroll.module'; import {BillingModule} from './billing/billing.module'; import {AiModule} from './ai/ai.module';
@Module({imports:[PayrollModule,BillingModule,AiModule]}) export class AppModule {}
