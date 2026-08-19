import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly openAiClient?: OpenAI;
  private readonly geminiClient?: OpenAI;

  constructor() {
    const openAiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openAiKey) {
      this.openAiClient = new OpenAI({ apiKey: openAiKey });
    }

    // Gemini exposes an OpenAI-compatible endpoint.
    if (geminiKey) {
      this.geminiClient = new OpenAI({
        apiKey: geminiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
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
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const openAiModel = process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-5.6-luna';

    // Primary provider: Google Gemini.
    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.chat.completions.create({
          model: geminiModel,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: question },
          ],
        });

        return this.result(
          response.choices[0]?.message?.content || 'No AI response was returned.',
          'google-gemini',
          geminiModel,
        );
      } catch (error) {
        console.warn('Google Gemini request failed; falling back to OpenAI.', error);
      }
    }

    // Fallback provider: OpenAI.
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
      'No AI provider is configured. Set GEMINI_API_KEY or OPENAI_API_KEY (AI_API_KEY is also supported for OpenAI fallback).',
    );
  }
}
