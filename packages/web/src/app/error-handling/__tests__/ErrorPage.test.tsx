import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useRouteError: vi.fn(),
    isRouteErrorResponse: vi.fn(),
  };
});

// Import after mocking
const { ErrorPage } = await import('../ErrorPage');

beforeEach(() => {
  vi.mocked(useRouteError).mockReturnValue(new Error('Something went wrong'));
  vi.mocked(isRouteErrorResponse).mockReturnValue(false);
});

describe('ErrorPage', () => {
  it('shows generic error title for non-route errors', () => {
    render(<ErrorPage />);
    expect(screen.getByRole('heading', { name: /une erreur est survenue/i })).toBeInTheDocument();
  });

  it('shows generic error description', () => {
    render(<ErrorPage />);
    expect(screen.getByText(/veuillez réessayer/i)).toBeInTheDocument();
  });

  it('shows 404 title for route error with status 404', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: 'Not Found', data: null });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);

    render(<ErrorPage />);
    expect(screen.getByRole('heading', { name: /page introuvable/i })).toBeInTheDocument();
  });

  it('shows 404 description for route error with status 404', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: 'Not Found', data: null });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);

    render(<ErrorPage />);
    expect(screen.getByText(/la page que vous cherchez n'existe pas/i)).toBeInTheDocument();
  });

  it('renders a link back to homepage', () => {
    render(<ErrorPage />);
    expect(screen.getByRole('link', { name: /retour à l'accueil/i })).toHaveAttribute('href', '/');
  });
});
