import axios, { type AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) throw new Error('VITE_API_BASE_URL is not defined');

export const apiClient = axios.create({
  baseURL,
  timeout: 60_000,
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message = (data?.message as string) ?? error.message;
    return Promise.reject(new ApiError(message, status));
  },
);
