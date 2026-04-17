import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders a 404 not found heading', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: /page introuvable/i })).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(<NotFoundPage />);
    expect(screen.getByText(/la page que vous cherchez n'existe pas/i)).toBeInTheDocument();
  });

  it('renders a link back to the homepage', () => {
    render(<NotFoundPage />);
    const link = screen.getByRole('link', { name: /retour à l'accueil/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
