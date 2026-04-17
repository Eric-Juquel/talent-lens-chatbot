import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import type { DetectedLink, UploadResponse } from './dto/upload-response.dto';

const ACCEPTED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async processFiles(files: {
    cv?: Express.Multer.File[];
    letter?: Express.Multer.File[];
    linkedin?: Express.Multer.File[];
  }): Promise<UploadResponse> {
    const cvFile = files.cv?.[0];
    const letterFile = files.letter?.[0];
    const linkedinFile = files.linkedin?.[0];

    const [cvText, letterText, linkedinText] = await Promise.all([
      cvFile ? this.extractText(cvFile) : Promise.resolve(''),
      letterFile ? this.extractText(letterFile) : Promise.resolve(''),
      linkedinFile ? this.extractText(linkedinFile) : Promise.resolve(''),
    ]);

    const allText = [cvText, letterText, linkedinText].join('\n');
    const detectedLinks = this.detectLinks(allText);
    const candidateName = this.extractCandidateName(cvText);

    this.logger.log(`Processed CV (${cvText.length} chars), ${detectedLinks.length} links detected`);

    return {
      cv: cvText,
      letter: letterText,
      linkedin: linkedinText,
      detectedLinks,
      candidateName,
    };
  }

  private sanitizeFilename(name: string): string {
    return [...name]
      .map((c) => { const n = c.codePointAt(0) ?? 0; return (n >= 0x20 && n !== 0x7F) ? c : '_'; })
      .join('');
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (!ACCEPTED_MIMETYPES.has(file.mimetype)) {
      this.logger.warn(`Unsupported file type "${file.mimetype}" for "${this.sanitizeFilename(file.originalname)}"`);
      return '';
    }
    try {
      if (file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        return result.text.trim();
      }
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value.trim();
      }
      // text/plain
      return file.buffer.toString('utf-8').trim();
    } catch (err) {
      this.logger.warn(`Failed to parse "${this.sanitizeFilename(file.originalname)}": ${String(err)}`);
      return '';
    }
  }

  private detectLinks(text: string): DetectedLink[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const found = text.match(urlRegex) ?? [];
    const seen = new Set<string>();
    const links: DetectedLink[] = [];

    for (const url of found) {
      const clean = url.replace(/[.,;:!?)"']+$/, '');
      if (seen.has(clean)) continue;
      seen.add(clean);
      links.push({
        label: this.getLinkLabel(clean),
        url: clean,
        type: this.getLinkType(clean),
      });
    }

    return links;
  }

  private getLinkType(url: string): DetectedLink['type'] {
    if (/github\.com/i.test(url)) return 'github';
    if (/linkedin\.com/i.test(url)) return 'linkedin';
    if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
    return 'portfolio';
  }

  private getLinkLabel(url: string): string {
    try {
      const { hostname, pathname } = new URL(url);
      const path = pathname.replace(/\/$/, '');
      return path ? `${hostname}${path}` : hostname;
    } catch {
      return url;
    }
  }

  private extractCandidateName(text: string): string {
    const CV_SECTION_KEYWORDS = new Set([
      'atout', 'atouts', 'formation', 'expérience', 'expériences', 'compétence', 'compétences',
      'langue', 'langues', 'loisir', 'loisirs', 'référence', 'références', 'profil', 'objectif',
      'coordonnée', 'coordonnées', 'contact', 'éducation', 'certification', 'certifications',
      'projet', 'projets', 'skill', 'skills', 'experience', 'education', 'summary', 'about',
      'profile', 'hobbies', 'interests', 'languages', 'curriculum vitae', 'cv', 'responsive',
      'design', 'développeur', 'developer', 'engineer', 'ingénieur', 'consultant', 'manager',
      'analyst', 'analyste', 'chef', 'lead', 'senior', 'junior', 'stage', 'intern', 'freelance',
      'fullstack', 'full-stack', 'full_stack', 'frontend', 'backend', 'devops', 'mobile', 'web',
      'data', 'cloud', 'agile', 'scrum', 'digital', 'informatique', 'informaticien',
    ]);

    const JOB_TITLE_KEYWORDS = new Set([
      'développeur', 'developer', 'engineer', 'ingénieur', 'consultant', 'manager', 'designer',
      'analyst', 'analyste', 'directeur', 'responsable', 'chef', 'lead', 'senior', 'junior',
      'stage', 'intern', 'freelance', 'fullstack', 'full-stack', 'full_stack', 'frontend',
      'backend', 'devops', 'mobile', 'web', 'data', 'cloud', 'agile', 'scrum', 'responsive',
    ]);

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20); // Only scan the first 20 lines

    for (const line of lines) {
      // Skip obvious non-names
      if (line.length > 50) continue;
      if (/[@|/\\:,;()\d]/.test(line)) continue;
      if (CV_SECTION_KEYWORDS.has(line.toLowerCase())) continue;
      // Skip lines containing job-title keywords
      const lineWords = line.toLowerCase().split(/\s+/);
      if (lineWords.some((w) => JOB_TITLE_KEYWORDS.has(w))) continue;

      // A name looks like 2-4 words, each starting with a capital letter
      const words = line.split(/\s+/);
      if (words.length < 2 || words.length > 4) continue;
      // Each word must start with uppercase and contain only letters/hyphens
      const looksLikeName = words.every((w) => /^[A-ZÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ][a-záàâäéèêëíìîïóòôöúùûü'-]+$/.test(w) && w.length >= 2);
      if (looksLikeName) return line;
    }

    return '';
  }
}
