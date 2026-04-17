import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

const buildHost = (method = 'GET', url = '/test') => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status, json };
  const request = { method, url };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, response: { status, json } };
};

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('responds with the HttpException status code', () => {
    const { host, response } = buildHost();
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('includes status code, message, and path in the JSON body', () => {
    const { host, response } = buildHost('POST', '/api/chat');
    filter.catch(new HttpException('Validation error', HttpStatus.UNPROCESSABLE_ENTITY), host);

    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(body.message).toBe('Validation error');
    expect(body.path).toBe('/api/chat');
    expect(body.timestamp).toBeDefined();
  });

  it('uses 500 for non-HttpException errors', () => {
    const { host, response } = buildHost();
    filter.catch(new Error('Unexpected crash'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('uses "Internal server error" message for non-HttpException', () => {
    const { host, response } = buildHost();
    filter.catch(new Error('DB down'), host);

    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error');
  });

  it('uses 500 for thrown primitive values (non-Error, non-HttpException)', () => {
    const { host, response } = buildHost();
    filter.catch('string error', host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('extracts message from HttpException response object', () => {
    const { host, response } = buildHost();
    const exception = new HttpException({ message: 'Custom message', error: 'Bad Request' }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, host);

    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.message).toBe('Custom message');
  });

  it('includes timestamp as ISO string', () => {
    const { host, response } = buildHost();
    filter.catch(new HttpException('Error', HttpStatus.BAD_REQUEST), host);

    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
