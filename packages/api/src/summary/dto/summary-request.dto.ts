import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const summaryRequestSchema = z.object({
  context: z.string().min(1).max(100_000),
  lang: z.enum(['fr', 'en']).default('fr'),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;

export class SummaryRequestDto extends createZodDto(summaryRequestSchema) {}
