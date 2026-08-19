import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly client?: OpenAI;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (apiKey) this.client = new OpenAI({ apiKey });
  }

  async answer(question: string) {
    if (!this.client) {
      throw new InternalServerErrorException('AI service is not configured');
    }

    const model = process.env.AI_MODEL || 'gpt-5.6-luna';
    const response = await this.client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are Softwall Payroll AI, an enterprise payroll assistant. Give accurate, practical guidance about payroll processing, employee deductions, payroll anomalies, compliance workflows, reporting, and workforce costs. Do not invent payroll data. When data is missing, clearly say what is needed. Do not provide legal or tax advice as a substitute for a qualified professional.',
        },
        { role: 'user', content: question },
      ],
    });

    return {
      answer: response.output_text,
      suggestions: [
        'Review payroll anomalies',
        'Check employee deductions',
        'Generate payroll cost forecast',
      ],
      providerConfigured: true,
      model,
    };
  }
}
