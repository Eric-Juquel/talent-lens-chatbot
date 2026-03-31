import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const skillItemSchema = z.object({
  name: z.string(),
  level: z.coerce.number().int().min(1).max(3).default(1) as z.ZodType<1 | 2 | 3>,
});

export const skillCategorySchema = z.object({
  category: z.string(),
  items: z.array(skillItemSchema),
});

export const summaryResponseSchema = z.object({
  name: z.string().default(''),
  title: z.string().default(''),
  location: z.string().default(''),
  summary: z.string().default(''),
  education: z.string().default(''),
  skills: z.array(skillCategorySchema).default([]),
  aiInsight: z.string().default(''),
});

export type SkillItem = z.infer<typeof skillItemSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

export class SummaryResponseDto extends createZodDto(summaryResponseSchema) {}
