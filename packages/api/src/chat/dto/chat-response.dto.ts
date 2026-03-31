import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const chatResponseSchema = z.object({
  reply: z.string(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export class ChatResponseDto extends createZodDto(chatResponseSchema) {}
