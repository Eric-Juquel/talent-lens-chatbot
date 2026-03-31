import { apiClient } from '@/api/client/axios.client';
import type { SummaryResponse } from '@/api/model/summary';

export const summaryService = {
  generateSummary: async (context: string, lang: string): Promise<SummaryResponse> => {
    const { data } = await apiClient.post<SummaryResponse>('/summary', { context, lang });
    return data;
  },
};
