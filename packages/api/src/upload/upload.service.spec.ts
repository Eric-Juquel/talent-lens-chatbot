const { mockGetText, mockExtractRawText } = vi.hoisted(() => ({
  mockGetText: vi.fn(),
  mockExtractRawText: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  // biome-ignore lint/style/useNamingConvention: mock constructor must be a regular function
  PDFParse: vi.fn(function () {
    return { getText: mockGetText };
  }),
}));

vi.mock('mammoth', () => ({
  default: { extractRawText: mockExtractRawText },
}));

import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadService } from './upload.service';

const makeFile = (
  content: string | Buffer,
  mimetype: string,
  originalname = 'test.txt',
): Express.Multer.File =>
  ({
    fieldname: 'cv',
    originalname,
    encoding: '7bit',
    mimetype,
    buffer: Buffer.isBuffer(content) ? content : Buffer.from(content),
    size: Buffer.isBuffer(content) ? content.length : content.length,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
  }) as Express.Multer.File;

const plainText = (content: string) => makeFile(content, 'text/plain');
const pdfFile = (originalname = 'cv.pdf') => makeFile(Buffer.alloc(10), 'application/pdf', originalname);
const docxFile = (originalname = 'cv.docx') =>
  makeFile(
    Buffer.alloc(10),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    originalname,
  );

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get(UploadService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processFiles()', () => {
    it('returns cv text and empty letter/linkedin when only cv provided', async () => {
      const result = await service.processFiles({ cv: [plainText('Jane Doe\nSoftware Engineer')] });

      expect(result.cv).toBe('Jane Doe\nSoftware Engineer');
      expect(result.letter).toBe('');
      expect(result.linkedin).toBe('');
    });

    it('processes all three files in parallel', async () => {
      const result = await service.processFiles({
        cv: [plainText('CV content')],
        letter: [plainText('Letter content')],
        linkedin: [plainText('LinkedIn content')],
      });

      expect(result.cv).toBe('CV content');
      expect(result.letter).toBe('Letter content');
      expect(result.linkedin).toBe('LinkedIn content');
    });

    it('returns all empty strings when no files provided', async () => {
      const result = await service.processFiles({});

      expect(result.cv).toBe('');
      expect(result.letter).toBe('');
      expect(result.linkedin).toBe('');
      expect(result.detectedLinks).toEqual([]);
    });

    it('detects links across all file texts combined', async () => {
      const result = await service.processFiles({
        cv: [plainText('Check https://github.com/jdoe')],
        letter: [plainText('See https://linkedin.com/in/jdoe')],
      });

      const urls = result.detectedLinks.map((l) => l.url);
      expect(urls).toContain('https://github.com/jdoe');
      expect(urls).toContain('https://linkedin.com/in/jdoe');
    });

    it('extracts candidate name from cv text', async () => {
      const result = await service.processFiles({
        cv: [plainText('Jane Doe\nSoftware Engineer\n5 years experience')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });
  });

  describe('extractText — PDF', () => {
    it('calls PDFParse and returns trimmed text', async () => {
      mockGetText.mockResolvedValue({ text: '  PDF content here  ' });

      const result = await service.processFiles({ cv: [pdfFile()] });

      expect(mockGetText).toHaveBeenCalledOnce();
      expect(result.cv).toBe('PDF content here');
    });

    it('returns empty string when PDFParse throws', async () => {
      mockGetText.mockRejectedValue(new Error('Corrupt PDF'));

      const result = await service.processFiles({ cv: [pdfFile()] });

      expect(result.cv).toBe('');
    });
  });

  describe('extractText — DOCX', () => {
    it('calls mammoth.extractRawText and returns trimmed value', async () => {
      mockExtractRawText.mockResolvedValue({ value: '  DOCX content  ' });

      const result = await service.processFiles({ cv: [docxFile()] });

      expect(mockExtractRawText).toHaveBeenCalledOnce();
      expect(result.cv).toBe('DOCX content');
    });

    it('returns empty string when mammoth throws', async () => {
      mockExtractRawText.mockRejectedValue(new Error('Cannot parse DOCX'));

      const result = await service.processFiles({ cv: [docxFile()] });

      expect(result.cv).toBe('');
    });
  });

  describe('extractText — plain text', () => {
    it('decodes buffer as UTF-8 and trims', async () => {
      const result = await service.processFiles({ cv: [plainText('  Hello World  ')] });

      expect(result.cv).toBe('Hello World');
    });
  });

  describe('extractText — unsupported mimetype', () => {
    it('returns empty string for unsupported file type', async () => {
      const unsupported = makeFile('data', 'image/png', 'photo.png');

      const result = await service.processFiles({ cv: [unsupported] });

      expect(result.cv).toBe('');
    });
  });

  describe('detectLinks()', () => {
    it('returns links with correct type for github URLs', async () => {
      const result = await service.processFiles({
        cv: [plainText('See https://github.com/alice/repo')],
      });

      expect(result.detectedLinks).toContainEqual(
        expect.objectContaining({ type: 'github', url: 'https://github.com/alice/repo' }),
      );
    });

    it('returns links with correct type for linkedin URLs', async () => {
      const result = await service.processFiles({
        cv: [plainText('Profile: https://www.linkedin.com/in/alice')],
      });

      expect(result.detectedLinks).toContainEqual(
        expect.objectContaining({ type: 'linkedin' }),
      );
    });

    it('returns links with correct type for twitter/x.com URLs', async () => {
      const resultTwitter = await service.processFiles({
        cv: [plainText('Follow me: https://twitter.com/alice')],
      });
      const resultX = await service.processFiles({
        cv: [plainText('Follow me: https://x.com/alice')],
      });

      expect(resultTwitter.detectedLinks[0].type).toBe('twitter');
      expect(resultX.detectedLinks[0].type).toBe('twitter');
    });

    it('classifies non-matching URL as portfolio', async () => {
      const result = await service.processFiles({
        cv: [plainText('Visit https://alice.dev/portfolio')],
      });

      expect(result.detectedLinks[0].type).toBe('portfolio');
    });

    it('deduplicates identical URLs', async () => {
      const result = await service.processFiles({
        cv: [plainText('https://github.com/alice https://github.com/alice')],
      });

      const urls = result.detectedLinks.map((l) => l.url);
      expect(urls.filter((u) => u === 'https://github.com/alice')).toHaveLength(1);
    });

    it('strips trailing punctuation from URL', async () => {
      const result = await service.processFiles({
        cv: [plainText('See https://github.com/alice.')],
      });

      expect(result.detectedLinks[0].url).toBe('https://github.com/alice');
    });

    it('builds correct label with hostname and path', async () => {
      const result = await service.processFiles({
        cv: [plainText('https://github.com/alice/my-repo')],
      });

      expect(result.detectedLinks[0].label).toBe('github.com/alice/my-repo');
    });

    it('uses only hostname when URL has no path', async () => {
      const result = await service.processFiles({
        cv: [plainText('https://alice.dev')],
      });

      expect(result.detectedLinks[0].label).toBe('alice.dev');
    });

    it('returns empty array for text with no URLs', async () => {
      const result = await service.processFiles({
        cv: [plainText('No links here at all.')],
      });

      expect(result.detectedLinks).toEqual([]);
    });
  });

  describe('extractCandidateName()', () => {
    it('extracts a 2-word name from the first lines', async () => {
      const result = await service.processFiles({
        cv: [plainText('Jane Doe\nSoftware Engineer')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('extracts a 3-word name', async () => {
      const result = await service.processFiles({
        cv: [plainText('Alice Marie Dupont\nProject Manager')],
      });

      expect(result.candidateName).toBe('Alice Marie Dupont');
    });

    it('skips lines longer than 50 characters', async () => {
      const longLine = 'A'.repeat(51);
      const result = await service.processFiles({
        cv: [plainText(`${longLine}\nJane Doe`)],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('skips lines containing digits', async () => {
      const result = await service.processFiles({
        cv: [plainText('Jane123 Doe\nJane Doe')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('skips lines containing @ symbol', async () => {
      const result = await service.processFiles({
        cv: [plainText('jane@doe.com\nJane Doe')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('skips keyword-only lines', async () => {
      const result = await service.processFiles({
        cv: [plainText('Formation\nJane Doe')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('skips job title lines containing role keywords', async () => {
      const result = await service.processFiles({
        cv: [plainText('Senior Developer\nJane Doe')],
      });

      expect(result.candidateName).toBe('Jane Doe');
    });

    it('returns empty string when no name is found', async () => {
      const result = await service.processFiles({
        cv: [plainText('software engineer\nexperience\njavascript typescript react')],
      });

      expect(result.candidateName).toBe('');
    });

    it('only scans the first 20 lines', async () => {
      const lines = Array.from({ length: 25 }, (_, i) => `Line ${i + 1}`);
      lines[21] = 'Jane Doe'; // line 22 — beyond the 20-line limit
      const result = await service.processFiles({
        cv: [plainText(lines.join('\n'))],
      });

      expect(result.candidateName).toBe('');
    });
  });
});
