import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const summaryRequestSchema = z.object({
  context: z.string().min(1),
  lang: z.string().default('fr'),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;

export class SummaryRequestDto extends createZodDto(summaryRequestSchema) {}
