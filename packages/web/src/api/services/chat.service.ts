import { apiClient } from '@/api/client/axios.client';
import type { ChatMessage } from '@/api/model/upload';

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  context: string;
  lang: string;
  candidateName: string;
}

export interface ChatResponse {
  reply: string;
}

export const chatService = {
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat', req);
    return data;
  },
};
