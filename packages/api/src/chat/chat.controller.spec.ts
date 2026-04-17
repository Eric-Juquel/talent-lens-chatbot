import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRequest } from './dto/chat-request.dto';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: { chat: ReturnType<typeof vi.fn> };

  const dto: ChatRequest = {
    message: 'Tell me about yourself',
    history: [],
    context: 'CV content',
    lang: 'en',
    candidateName: 'Jane Doe',
  };

  beforeEach(async () => {
    service = { chat: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: service }],
    }).compile();

    controller = module.get(ChatController);
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  it('delegates to ChatService.chat with the request DTO', async () => {
    service.chat.mockResolvedValue({ reply: 'I am Jane Doe.' });

    const result = await controller.chat(dto);

    expect(service.chat).toHaveBeenCalledOnce();
    expect(service.chat).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ reply: 'I am Jane Doe.' });
  });

  it('propagates service errors without catching them', async () => {
    service.chat.mockRejectedValue(new Error('OpenAI unavailable'));

    await expect(controller.chat(dto)).rejects.toThrow('OpenAI unavailable');
  });
});
