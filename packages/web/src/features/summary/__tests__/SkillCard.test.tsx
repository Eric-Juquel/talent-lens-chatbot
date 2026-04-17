import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { SkillCard } from '../components/SkillCard';

const group = {
  category: 'Frontend' as const,
  items: [
    { name: 'React', level: 3 as const },
    { name: 'TypeScript', level: 2 as const },
    { name: 'Vue', level: 1 as const },
  ],
};

describe('SkillCard', () => {
  it('renders category as a heading', () => {
    render(<SkillCard group={group} />);
    expect(screen.getByRole('heading', { name: /frontend/i })).toBeInTheDocument();
  });

  it('renders all skill names', () => {
    render(<SkillCard group={group} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('renders sr-only level text for each skill', () => {
    render(<SkillCard group={group} />);
    expect(screen.getByText('Level 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Level 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Level 1 of 3')).toBeInTheDocument();
  });

  it('renders a list item per skill', () => {
    render(<SkillCard group={group} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('uses i18n translation for known category names', () => {
    render(<SkillCard group={{ category: 'Backend', items: [] }} />);
    expect(screen.getByRole('heading', { name: /backend/i })).toBeInTheDocument();
  });

  it('falls back to the raw category name when no translation exists', () => {
    render(<SkillCard group={{ category: 'Frontend', items: [{ name: 'Svelte', level: 1 }] }} />);
    expect(screen.getByText('Svelte')).toBeInTheDocument();
  });
});
