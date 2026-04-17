import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import
import { ConfigService } from '@nestjs/config';
import { jsonrepair } from 'jsonrepair';
import OpenAI from 'openai';
import type { SummaryRequest } from './dto/summary-request.dto';
import { type SummaryResponse, summaryResponseSchema } from './dto/summary-response.dto';

const buildSystemPrompt = (lang: string) => {
  const isFr = lang.startsWith('fr');
  return isFr
    ? `Tu es un analyste RH professionnel. Analyse les documents du candidat et retourne un objet JSON.
Retourne UNIQUEMENT du JSON valide correspondant exactement à cette structure — sans markdown, sans explication :

{
  "name": "prénom et nom de famille du candidat (ex: 'Jean Dupont') — cherche dans l'en-tête du CV, la signature, ou toute mention du nom propre de la personne. Ne mets PAS le titre de poste ici.",
  "title": "poste actuel ou visé",
  "location": "ville/pays si disponible, chaîne vide sinon",
  "summary": "résumé professionnel en 2-3 phrases, rédigé en français, à la troisième personne",
  "education": "diplôme le plus élevé + établissement si disponible",
  "skills": [{ "category": "Frontend", "items": [{ "name": "nom de la compétence", "level": 1 }] }],
  "aiInsight": "2-3 phrases en français : analyse recruteur, points forts et axes à explorer en entretien"
}

Les catégories doivent être exactement : Frontend, Backend, Outils, Soft Skills
Niveau : 1 = débutant, 2 = intermédiaire, 3 = expert
Regroupe TOUTES les compétences identifiées dans la catégorie appropriée. N'inclus que les catégories ayant des éléments.`
    : `You are a professional HR analyst. Analyze the candidate's documents and return a JSON object.
Return ONLY valid JSON matching exactly this structure — no markdown, no explanation:

{
  "name": "candidate's first and last name (e.g. 'John Smith') — look in the CV header, signature, or any mention of the person's proper name. Do NOT put the job title here.",
  "title": "current or target job title",
  "location": "city/country if available, empty string otherwise",
  "summary": "professional summary in 2-3 sentences, written in English, third person",
  "education": "highest degree + institution if available",
  "skills": [{ "category": "Frontend", "items": [{ "name": "skill name", "level": 1 }] }],
  "aiInsight": "2-3 sentences in English: recruiter analysis, key strengths and areas to explore in interview"
}

Categories must be exactly: Frontend, Backend, Tools, Soft Skills
Level: 1 = beginner, 2 = intermediate, 3 = expert
Group ALL identified skills in the appropriate category. Only include categories with items.`;
};

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  private readonly openai: OpenAI;

  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
      ...(baseURL ? { baseURL } : {}),
    });
  }

  async generateSummary(dto: SummaryRequest): Promise<SummaryResponse> {
    const isOpenAI = !this.config.get<string>('OPENAI_BASE_URL');

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(dto.lang) },
          {
            role: 'user',
            content: `IMPORTANT: Write ALL text values in the JSON in ${dto.lang.startsWith('fr') ? 'French' : 'English'}. Do not use any other language, even if the documents are written in a different language.\n\n## Candidate Documents:\n${dto.context}`,
          },
        ],
        ...(isOpenAI ? { response_format: { type: 'json_object' } } : {}),
      });

      const raw = response.choices[0].message.content ?? '{}';
      // Strip markdown code fences that some models add despite instructions
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      // Repair malformed JSON (unescaped newlines, trailing commas, etc.)
      const repaired = jsonrepair(cleaned);

      const parsed = JSON.parse(repaired) as unknown;
      return summaryResponseSchema.parse(parsed);
    } catch (err) {
      this.logger.error(`Failed to generate summary — ${String(err)}`);
      if (err instanceof Error) this.logger.debug(err.stack ?? '');
      throw new InternalServerErrorException('Failed to generate candidate summary');
    }
  }
}
