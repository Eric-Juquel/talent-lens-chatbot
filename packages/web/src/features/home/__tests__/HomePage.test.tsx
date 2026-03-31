import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import HomePage from '../pages/HomePage';

describe('HomePage', () => {
  it('renders step 1 upload UI', () => {
    render(<HomePage />);
    // Step indicator is rendered
    expect(screen.getByRole('navigation', { name: /wizard steps/i })).toBeInTheDocument();
  });

  it('shows upload step by default', () => {
    render(<HomePage />);
    // The analyze button exists and is disabled without a CV
    const analyzeBtn = screen.getByRole('button', { name: /analyser le profil|analyze profile/i });
    expect(analyzeBtn).toBeDisabled();
  });
});
