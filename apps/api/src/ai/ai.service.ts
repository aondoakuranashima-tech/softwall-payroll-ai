import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly freeClient?: OpenAI;
  private readonly openAiClient?: OpenAI;

  constructor() {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    if (openRouterKey) {
      this.freeClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.APP_URL || 'https://softwall-payroll-web.onrender.com',
          'X-Title': 'Softwall Payroll AI',
        },
      });
    }

    if (openAiKey) {
      this.openAiClient = new OpenAI({ apiKey: openAiKey });
    }
  }

  private readonly systemPrompt =
    'You are Softwall Payroll AI, an enterprise payroll assistant. Give accurate, practical guidance about payroll processing, employee deductions, payroll anomalies, compliance workflows, reporting, and workforce costs. Do not invent payroll data. When data is missing, clearly say what is needed. Do not provide legal or tax advice as a substitute for a qualified professional.';

  private result(answer: string, provider: string, model: string) {
    return {
      answer,
      suggestions: [
        'Review payroll anomalies',
        'Check employee deductions',
        'Generate payroll cost forecast',
      ],
      providerConfigured: true,
      provider,
      model,
    };
  }

  async answer(question: string) {
    const freeModel = process.env.OPENROUTER_MODEL || 'openrouter/free';
    const openAiModel = process.env.AI_MODEL || 'gpt-5.6-luna';

    // Primary: free OpenAI-compatible provider (OpenRouter).
    if (this.freeClient) {
      try {
        const response = await this.freeClient.responses.create({
          model: freeModel,
          input: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: question },
          ],
        });

        return this.result(response.output_text, 'openrouter', freeModel);
      } catch (error) {
        console.warn('OpenRouter AI request failed; falling back to OpenAI.', error);
      }
    }

    // Fallback: direct OpenAI API.
    if (this.openAiClient) {
      try {
        const response = await this.openAiClient.responses.create({
          model: openAiModel,
          input: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: question },
          ],
        });

        return this.result(response.output_text, 'openai', openAiModel);
      } catch (error) {
        console.error('OpenAI fallback request failed.', error);
      }
    }

    throw new InternalServerErrorException(
      'No AI provider is configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY (AI_API_KEY is also supported for OpenAI fallback).',
    );
  }
}
