const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('openai', () => ({
  // biome-ignore lint/style/useNamingConvention: mock constructor must be a regular function
  default: vi.fn(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SummaryService } from './summary.service';
import type { SummaryRequest } from './dto/summary-request.dto';

const validSummaryPayload = {
  name: 'Jane Doe',
  title: 'Software Engineer',
  location: 'Paris, France',
  summary: 'Experienced developer with 5 years of experience.',
  education: 'MSc Computer Science, Sorbonne',
  skills: [{ category: 'Frontend', items: [{ name: 'React', level: 3 }] }],
  aiInsight: 'Strong candidate with solid fundamentals.',
};

const openAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

const baseDto: SummaryRequest = {
  context: 'CV: Jane Doe\nSoftware Engineer with 5 years of experience.',
  lang: 'en',
};

describe('SummaryService', () => {
  let service: SummaryService;
  let mockConfig: { get: ReturnType<typeof vi.fn>; getOrThrow: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockConfig = {
      get: vi.fn((key: string, def?: unknown) => {
        if (key === 'OPENAI_MODEL') return 'test-model';
        return def ?? undefined;
      }),
      getOrThrow: vi.fn().mockReturnValue('sk-test-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(SummaryService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSummary()', () => {
    it('returns parsed summary for a valid JSON response', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      const result = await service.generateSummary(baseDto);

      expect(result.name).toBe('Jane Doe');
      expect(result.title).toBe('Software Engineer');
      expect(result.skills[0].category).toBe('Frontend');
    });

    it('strips markdown code fences before parsing', async () => {
      const fenced = `\`\`\`json\n${JSON.stringify(validSummaryPayload)}\n\`\`\``;
      mockCreate.mockResolvedValue(openAIResponse(fenced));

      const result = await service.generateSummary(baseDto);

      expect(result.name).toBe('Jane Doe');
    });

    it('repairs malformed JSON with jsonrepair', async () => {
      const malformed = `{"name": "Jane Doe", "title": "Engineer", "location": "", "summary": "", "education": "", "skills": [], "aiInsight": "Good",}`;
      mockCreate.mockResolvedValue(openAIResponse(malformed));

      const result = await service.generateSummary(baseDto);

      expect(result.name).toBe('Jane Doe');
    });

    it('uses default values for missing optional fields', async () => {
      const minimal = { name: 'Jane Doe' };
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(minimal)));

      const result = await service.generateSummary(baseDto);

      expect(result.title).toBe('');
      expect(result.skills).toEqual([]);
    });

    it('throws InternalServerErrorException when OpenAI call fails', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      await expect(service.generateSummary(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when response cannot be parsed as JSON', async () => {
      mockCreate.mockResolvedValue(openAIResponse('not json at all !@#'));

      await expect(service.generateSummary(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when schema validation fails', async () => {
      const invalidSchema = { name: 123, skills: 'not-an-array' };
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(invalidSchema)));

      await expect(service.generateSummary(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('handles null content from OpenAI by using empty object fallback', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });

      const result = await service.generateSummary(baseDto);

      expect(result.name).toBe('');
    });
  });

  describe('system prompt language', () => {
    it('uses English system prompt for lang "en"', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await service.generateSummary({ ...baseDto, lang: 'en' });

      const messages = mockCreate.mock.calls[0][0].messages;
      expect(messages[0].content).toContain('HR analyst');
    });

    it('uses French system prompt for lang "fr"', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await service.generateSummary({ ...baseDto, lang: 'fr' });

      const messages = mockCreate.mock.calls[0][0].messages;
      expect(messages[0].content).toContain('analyste RH');
    });

    it('instructs the model to write in English in the user message', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await service.generateSummary({ ...baseDto, lang: 'en' });

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('English');
    });

    it('instructs the model to write in French in the user message', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await service.generateSummary({ ...baseDto, lang: 'fr' });

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('French');
    });
  });

  describe('response_format configuration', () => {
    it('sends response_format json_object when no OPENAI_BASE_URL (OpenAI)', async () => {
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await service.generateSummary(baseDto);

      expect(mockCreate.mock.calls[0][0]).toHaveProperty('response_format', { type: 'json_object' });
    });

    it('omits response_format when OPENAI_BASE_URL is set (custom endpoint)', async () => {
      mockConfig.get.mockImplementation((key: string, def?: unknown) => {
        if (key === 'OPENAI_BASE_URL') return 'https://custom.api/v1';
        if (key === 'OPENAI_MODEL') return 'test-model';
        return def ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [SummaryService, { provide: ConfigService, useValue: mockConfig }],
      }).compile();
      const svc = module.get(SummaryService);
      mockCreate.mockResolvedValue(openAIResponse(JSON.stringify(validSummaryPayload)));

      await svc.generateSummary(baseDto);

      expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('response_format');
    });
  });
});
