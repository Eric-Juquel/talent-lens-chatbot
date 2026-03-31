import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const detectedLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  type: z.enum(['github', 'linkedin', 'portfolio', 'twitter', 'other']),
});

export const uploadResponseSchema = z.object({
  cv: z.string(),
  letter: z.string(),
  linkedin: z.string(),
  detectedLinks: z.array(detectedLinkSchema),
  candidateName: z.string(),
});

export type DetectedLink = z.infer<typeof detectedLinkSchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export class UploadResponseDto extends createZodDto(uploadResponseSchema) {}
