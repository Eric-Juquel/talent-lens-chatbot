import { http, HttpResponse } from 'msw';
import type { UploadResponse } from '@/api/model/upload';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const mockUploadResponse: UploadResponse = {
  cv: 'John Doe — Senior React Developer\nEmail: john@example.com\nGitHub: https://github.com/johndoe',
  letter: '',
  linkedin: '',
  detectedLinks: [
    { label: 'GitHub', url: 'https://github.com/johndoe', type: 'github' },
    { label: 'Portfolio', url: 'https://johndoe.dev', type: 'portfolio' },
  ],
  candidateName: 'John Doe',
};

export const uploadHandlers = [
  http.post(`${API_URL}/upload`, () => {
    return HttpResponse.json(mockUploadResponse);
  }),
];
