import { http, HttpResponse } from 'msw';
import type { SummaryResponse } from '@/api/model/summary';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const mockSummary: SummaryResponse = {
  name: 'John Doe',
  title: 'Senior Frontend Developer',
  location: 'Paris, France',
  summary: 'Experienced frontend developer with 5 years of React expertise. Passionate about clean code and user experience.',
  education: 'Master\'s in Computer Science — Université Paris VII',
  skills: [
    {
      category: 'Frontend',
      items: [
        { name: 'React', level: 3 },
        { name: 'TypeScript', level: 3 },
        { name: 'Tailwind CSS', level: 2 },
      ],
    },
    {
      category: 'Backend',
      items: [
        { name: 'Node.js', level: 2 },
        { name: 'NestJS', level: 2 },
      ],
    },
  ],
  aiInsight: 'Strong frontend profile with solid TypeScript foundations. Ideal for a lead frontend role. Worth exploring system design experience during the interview.',
};

export const summaryHandlers = [
  http.post(`${API_URL}/summary`, () => {
    return HttpResponse.json(mockSummary);
  }),
];
