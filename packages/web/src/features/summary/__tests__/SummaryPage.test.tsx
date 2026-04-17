import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { useTalentStore } from '@/shared/stores/talent.store';
import SummaryPage from '../pages/SummaryPage';

const mockSummaryResult = {
  name: 'John Doe',
  title: 'Senior Frontend Developer',
  location: 'Paris, France',
  summary: 'Experienced developer with solid React expertise.',
  education: "Master's in Computer Science — Université Paris VII",
  skills: [
    {
      category: 'Frontend' as const,
      items: [
        { name: 'React', level: 3 as const },
        { name: 'TypeScript', level: 2 as const },
      ],
    },
  ],
  aiInsight: 'Strong frontend profile. Worth exploring system design experience.',
};

const mockUploadResult = {
  cv: 'CV text',
  letter: '',
  linkedin: '',
  detectedLinks: [{ label: 'GitHub', url: 'https://github.com/jd', type: 'github' as const }],
  candidateName: 'John Doe',
};

beforeEach(() => {
  useTalentStore.getState().reset();
});

describe('SummaryPage', () => {
  describe('when summaryResult is null', () => {
    it('renders no candidate content (component returns null)', () => {
      render(<SummaryPage />);
      expect(screen.queryByRole('heading', { name: /john doe/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retour au chat/i })).not.toBeInTheDocument();
    });
  });

  describe('when summaryResult is available', () => {
    beforeEach(() => {
      useTalentStore.setState({ summaryResult: mockSummaryResult });
    });

    it('renders candidate name as heading', () => {
      render(<SummaryPage />);
      expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    });

    it('renders candidate title', () => {
      render(<SummaryPage />);
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    });

    it('renders initials in the avatar', () => {
      render(<SummaryPage />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders location', () => {
      render(<SummaryPage />);
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
    });

    it('renders summary text', () => {
      render(<SummaryPage />);
      expect(screen.getByText('Experienced developer with solid React expertise.')).toBeInTheDocument();
    });

    it('renders education section', () => {
      render(<SummaryPage />);
      expect(screen.getByText(/master's in computer science/i)).toBeInTheDocument();
    });

    it('renders skills section with skill names', () => {
      render(<SummaryPage />);
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders AI insight', () => {
      render(<SummaryPage />);
      expect(screen.getByText('Strong frontend profile. Worth exploring system design experience.')).toBeInTheDocument();
    });

    it('does not render education when empty', () => {
      useTalentStore.setState({ summaryResult: { ...mockSummaryResult, education: '' } });
      render(<SummaryPage />);
      expect(screen.queryByText('Formation')).not.toBeInTheDocument();
    });

    it('does not render location when empty', () => {
      useTalentStore.setState({ summaryResult: { ...mockSummaryResult, location: '' } });
      render(<SummaryPage />);
      expect(screen.queryByText('Paris, France')).not.toBeInTheDocument();
    });

    it('does not render AI insight section when empty', () => {
      useTalentStore.setState({ summaryResult: { ...mockSummaryResult, aiInsight: '' } });
      render(<SummaryPage />);
      expect(screen.queryByText('Analyse IA — Point de vue recruteur')).not.toBeInTheDocument();
    });

    it('renders detected links from uploadResult', () => {
      useTalentStore.setState({ summaryResult: mockSummaryResult, uploadResult: mockUploadResult });
      render(<SummaryPage />);
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    });

    it('does not render links section when uploadResult is null', () => {
      useTalentStore.setState({ summaryResult: mockSummaryResult, uploadResult: null });
      render(<SummaryPage />);
      expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument();
    });
  });

  describe('navigation actions', () => {
    beforeEach(() => {
      useTalentStore.setState({ summaryResult: mockSummaryResult });
    });

    it('sets step to 3 when "Retour au chat" is clicked', async () => {
      const user = userEvent.setup();
      render(<SummaryPage />);

      await user.click(screen.getByRole('button', { name: /retour au chat/i }));
      expect(useTalentStore.getState().step).toBe(3);
    });

    it('resets store when "Nouvelle analyse" is clicked', async () => {
      const user = userEvent.setup();
      useTalentStore.setState({ summaryResult: mockSummaryResult, uploadResult: mockUploadResult });
      render(<SummaryPage />);

      await user.click(screen.getByRole('button', { name: /nouvelle analyse/i }));
      expect(useTalentStore.getState().summaryResult).toBeNull();
      expect(useTalentStore.getState().uploadResult).toBeNull();
    });
  });
});
