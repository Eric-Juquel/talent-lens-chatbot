import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SummaryRequest } from './dto/summary-request.dto';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

describe('SummaryController', () => {
  let controller: SummaryController;
  let service: { generateSummary: ReturnType<typeof vi.fn> };

  const dto: SummaryRequest = {
    context: 'CV text content',
    lang: 'en',
  };

  const mockSummary = {
    name: 'Jane Doe',
    title: 'Software Engineer',
    location: 'Paris',
    summary: 'Experienced developer.',
    education: 'MSc Computer Science',
    skills: [],
    aiInsight: 'Strong candidate.',
  };

  beforeEach(async () => {
    service = { generateSummary: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [{ provide: SummaryService, useValue: service }],
    }).compile();

    controller = module.get(SummaryController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to SummaryService.generateSummary with the request DTO', async () => {
    service.generateSummary.mockResolvedValue(mockSummary);

    const result = await controller.generateSummary(dto);

    expect(service.generateSummary).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockSummary);
  });

  it('propagates service errors', async () => {
    service.generateSummary.mockRejectedValue(new Error('AI failed'));

    await expect(controller.generateSummary(dto)).rejects.toThrow('AI failed');
  });
});
