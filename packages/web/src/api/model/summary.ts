export interface SkillItem {
  name: string;
  level: 1 | 2 | 3;
}

export type SkillCategory = 'Frontend' | 'Backend' | 'Outils' | 'Soft Skills';

export interface SkillGroup {
  category: SkillCategory;
  items: SkillItem[];
}

export interface SummaryResponse {
  name: string;
  title: string;
  location: string;
  summary: string;
  education: string;
  skills: SkillGroup[];
  aiInsight: string;
}
