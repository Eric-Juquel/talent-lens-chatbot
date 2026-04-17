const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('openai', () => ({
  // biome-ignore lint/style/useNamingConvention: mock constructor must be a regular function
  default: vi.fn(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service';
import type { ChatRequest } from './dto/chat-request.dto';

const directResponse = (content: string | null) => ({
  choices: [{ finish_reason: 'stop', message: { content, tool_calls: undefined } }],
});

const toolCallResponse = (toolName: string, args: Record<string, unknown>) => ({
  choices: [{
    finish_reason: 'tool_calls',
    message: {
      content: null,
      tool_calls: [{
        id: 'call_abc',
        type: 'function',
        function: { name: toolName, arguments: JSON.stringify(args) },
      }],
    },
  }],
});

const baseDto: ChatRequest = {
  message: 'Tell me about your experience',
  history: [],
  context: 'CV: Senior developer with 5 years experience.',
  lang: 'en',
  candidateName: 'Jane Doe',
};

describe('ChatService', () => {
  let service: ChatService;
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
        ChatService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('chat()', () => {
    it('returns reply for a direct AI response', async () => {
      mockCreate.mockResolvedValue(directResponse('I have 5 years of experience.'));

      const result = await service.chat(baseDto);

      expect(result).toEqual({ reply: 'I have 5 years of experience.' });
    });

    it('includes history messages in the API call', async () => {
      const dtoWithHistory: ChatRequest = {
        ...baseDto,
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      };
      mockCreate.mockResolvedValue(directResponse('Sure!'));

      await service.chat(dtoWithHistory);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(4); // system + 2 history + user
      expect(callArgs.messages[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(callArgs.messages[2]).toEqual({ role: 'assistant', content: 'Hi there' });
    });

    it('handles record_unknown_question tool call then returns reply', async () => {
      mockCreate
        .mockResolvedValueOnce(toolCallResponse('record_unknown_question', { question: 'What is your salary expectation?' }))
        .mockResolvedValueOnce(directResponse('I am sorry, I cannot answer that.'));

      const result = await service.chat(baseDto);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ reply: 'I am sorry, I cannot answer that.' });
    });

    it('handles record_user_details tool call then returns reply', async () => {
      mockCreate
        .mockResolvedValueOnce(toolCallResponse('record_user_details', { email: 'hr@company.com', name: 'Alice' }))
        .mockResolvedValueOnce(directResponse('Thank you Alice, I noted your email.'));

      const result = await service.chat(baseDto);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ reply: 'Thank you Alice, I noted your email.' });
    });

    it('pushes tool result messages back into the conversation', async () => {
      mockCreate
        .mockResolvedValueOnce(toolCallResponse('record_unknown_question', { question: 'salary?' }))
        .mockResolvedValueOnce(directResponse('No info available.'));

      await service.chat(baseDto);

      const secondCallMessages = mockCreate.mock.calls[1][0].messages;
      const toolResultMsg = secondCallMessages.find((m: { role: string }) => m.role === 'tool');
      expect(toolResultMsg).toBeDefined();
      expect(toolResultMsg.content).toBe(JSON.stringify({ recorded: 'ok' }));
    });

    it('propagates OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(service.chat(baseDto)).rejects.toThrow('Rate limit exceeded');
    });

    it('returns empty string reply when model returns null content', async () => {
      mockCreate.mockResolvedValue(directResponse(null));

      const result = await service.chat(baseDto);

      expect(result).toEqual({ reply: '' });
    });
  });

  describe('system prompt language', () => {
    it('includes "English" directive for lang "en"', async () => {
      mockCreate.mockResolvedValue(directResponse('Answer'));

      await service.chat({ ...baseDto, lang: 'en' });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain('English');
    });

    it('includes "French" directive for lang "fr"', async () => {
      mockCreate.mockResolvedValue(directResponse('Réponse'));

      await service.chat({ ...baseDto, lang: 'fr' });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain('French');
    });

    it('uses candidateName in the system prompt', async () => {
      mockCreate.mockResolvedValue(directResponse('Yes'));

      await service.chat({ ...baseDto, candidateName: 'Marie Curie' });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain('Marie Curie');
    });

    it('falls back to "the candidate" for empty candidateName', async () => {
      mockCreate.mockResolvedValue(directResponse('Yes'));

      await service.chat({ ...baseDto, candidateName: '' });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain('the candidate');
    });

    it('strips control characters from candidateName', async () => {
      mockCreate.mockResolvedValue(directResponse('Yes'));

      await service.chat({ ...baseDto, candidateName: 'Jane\x00\x01Doe' });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).not.toContain('\x00');
      expect(systemContent).toContain('JaneDoe');
    });

    it('truncates candidateName to 100 characters', async () => {
      const longName = 'A'.repeat(150);
      mockCreate.mockResolvedValue(directResponse('Yes'));

      await service.chat({ ...baseDto, candidateName: longName });

      const systemContent: string = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemContent).toContain('A'.repeat(100));
      expect(systemContent).not.toContain('A'.repeat(101));
    });
  });

  describe('sanitizeReply', () => {
    it('returns EN fallback when model returns a valid JSON object', async () => {
      mockCreate.mockResolvedValue(directResponse('{"data": "test"}'));

      const result = await service.chat({ ...baseDto, lang: 'en' });

      expect(result.reply).toBe("I'm sorry, I couldn't process that question. Could you rephrase it?");
    });

    it('returns FR fallback when model returns a valid JSON object (fr)', async () => {
      mockCreate.mockResolvedValue(directResponse('{"data": "test"}'));

      const result = await service.chat({ ...baseDto, lang: 'fr' });

      expect(result.reply).toBe('Je suis désolé, je n\'ai pas pu traiter cette question. Pourriez-vous la reformuler ?');
    });

    it('returns text as-is when response starts with { but is not valid JSON', async () => {
      mockCreate.mockResolvedValue(directResponse('{not valid json here'));

      const result = await service.chat({ ...baseDto, lang: 'en' });

      expect(result.reply).toBe('{not valid json here');
    });

    it('strips inline record_* JSON patterns from text', async () => {
      mockCreate.mockResolvedValue(
        directResponse('I cannot answer that. {"name": "record_unknown_question", "question": "salary"} Could you rephrase?'),
      );

      const result = await service.chat(baseDto);

      expect(result.reply).toBe('I cannot answer that. Could you rephrase?');
    });

    it('trims whitespace from the reply', async () => {
      mockCreate.mockResolvedValue(directResponse('  Hello World  '));

      const result = await service.chat(baseDto);

      expect(result.reply).toBe('Hello World');
    });
  });

  describe('OpenAI configuration', () => {
    it('uses configured model name', async () => {
      mockCreate.mockResolvedValue(directResponse('OK'));

      await service.chat(baseDto);

      expect(mockCreate.mock.calls[0][0].model).toBe('test-model');
    });

    it('uses default gpt-4o-mini model when OPENAI_MODEL not set', async () => {
      mockConfig.get.mockImplementation((key: string, def?: unknown) => def ?? undefined);

      const module = await Test.createTestingModule({
        providers: [ChatService, { provide: ConfigService, useValue: mockConfig }],
      }).compile();
      const svc = module.get(ChatService);
      mockCreate.mockResolvedValue(directResponse('OK'));

      await svc.chat(baseDto);

      expect(mockCreate.mock.calls[0][0].model).toBe('gpt-4o-mini');
    });

    it('passes baseURL to OpenAI when OPENAI_BASE_URL is set', async () => {
      const OpenAI = (await import('openai')).default as ReturnType<typeof vi.fn>;
      mockConfig.get.mockImplementation((key: string, def?: unknown) => {
        if (key === 'OPENAI_BASE_URL') return 'https://custom.api/v1';
        if (key === 'OPENAI_MODEL') return 'test-model';
        return def ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [ChatService, { provide: ConfigService, useValue: mockConfig }],
      }).compile();
      module.get(ChatService);

      const constructorCall = OpenAI.mock.calls.at(-1)?.[0] as { baseURL?: string };
      expect(constructorCall?.baseURL).toBe('https://custom.api/v1');
    });
  });
});
