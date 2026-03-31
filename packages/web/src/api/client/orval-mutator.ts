import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiClient } from './axios.client';

export const orvalMutator = <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient(config);
};

export type ErrorType<Error> = import('axios').AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
