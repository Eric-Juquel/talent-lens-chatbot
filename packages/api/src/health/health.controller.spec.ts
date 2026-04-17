import { Test, type TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: { check: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    healthService = { check: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthCheckService, useValue: healthService }],
    }).compile();

    controller = module.get(HealthController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls HealthCheckService.check with an empty indicators array', async () => {
    healthService.check.mockResolvedValue({ status: 'ok', info: {}, error: {}, details: {} });

    await controller.check();

    expect(healthService.check).toHaveBeenCalledWith([]);
  });

  it('returns the health check result', async () => {
    const healthResult = { status: 'ok', info: {}, error: {}, details: {} };
    healthService.check.mockResolvedValue(healthResult);

    const result = await controller.check();

    expect(result).toEqual(healthResult);
  });

  it('propagates health check errors', async () => {
    healthService.check.mockRejectedValue(new Error('Service unavailable'));

    await expect(controller.check()).rejects.toThrow('Service unavailable');
  });
});
