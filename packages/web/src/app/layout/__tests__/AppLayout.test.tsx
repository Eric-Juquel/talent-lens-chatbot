import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { useAppStore } from '@/shared/stores/app.store';
import { AppLayout } from '../AppLayout';

beforeEach(() => {
  useAppStore.setState({ theme: 'dark', locale: 'fr' });
});

describe('AppLayout', () => {
  it('renders the header landmark', () => {
    render(<AppLayout />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the main content area with correct id', () => {
    render(<AppLayout />);
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders the TalentLens logo inside the header', () => {
    render(<AppLayout />);
    expect(screen.getByRole('link', { name: /talentlens/i })).toBeInTheDocument();
  });
});
