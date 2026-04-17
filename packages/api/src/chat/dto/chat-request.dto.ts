import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(chatMessageSchema).max(50).default([]),
  context: z.string().max(50_000),
  lang: z.enum(['fr', 'en']).default('fr'),
  candidateName: z.string().max(100).default(''),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
