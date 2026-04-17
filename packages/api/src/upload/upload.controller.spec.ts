import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let service: { processFiles: ReturnType<typeof vi.fn> };

  const mockFiles = {
    cv: [{ originalname: 'cv.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as Express.Multer.File],
  };

  const mockResponse = {
    cv: 'Jane Doe\nSoftware Engineer',
    letter: '',
    linkedin: '',
    detectedLinks: [],
    candidateName: 'Jane Doe',
  };

  beforeEach(async () => {
    service = { processFiles: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: service }],
    }).compile();

    controller = module.get(UploadController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to UploadService.processFiles with the uploaded files', async () => {
    service.processFiles.mockResolvedValue(mockResponse);

    const result = await controller.uploadFiles(mockFiles);

    expect(service.processFiles).toHaveBeenCalledWith(mockFiles);
    expect(result).toEqual(mockResponse);
  });

  it('propagates service errors', async () => {
    service.processFiles.mockRejectedValue(new Error('Parse failed'));

    await expect(controller.uploadFiles(mockFiles)).rejects.toThrow('Parse failed');
  });
});
