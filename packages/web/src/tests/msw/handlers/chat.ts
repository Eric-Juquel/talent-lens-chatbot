import { http, HttpResponse } from 'msw';
import type { ChatResponse } from '@/api/services/chat.service';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const chatHandlers = [
  http.post(`${API_URL}/chat`, () => {
    const response: ChatResponse = {
      reply: 'John Doe has 5 years of experience with React and TypeScript.',
    };
    return HttpResponse.json(response);
  }),
];
