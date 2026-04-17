import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { LinkBadge } from '../components/LinkBadge';

describe('LinkBadge', () => {
  it('renders a link with the correct href', () => {
    render(<LinkBadge link={{ url: 'https://github.com/user', type: 'github', label: '' }} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://github.com/user');
  });

  it('opens in new tab with noopener rel', () => {
    render(<LinkBadge link={{ url: 'https://github.com/user', type: 'github', label: '' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows default "GitHub" label for github type', () => {
    render(<LinkBadge link={{ url: 'https://github.com/user', type: 'github', label: '' }} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('shows default "LinkedIn" label for linkedin type', () => {
    render(<LinkBadge link={{ url: 'https://linkedin.com/in/user', type: 'linkedin', label: '' }} />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('shows default "Portfolio" label for portfolio type', () => {
    render(<LinkBadge link={{ url: 'https://portfolio.dev', type: 'portfolio', label: '' }} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('shows default "Lien" label for other type', () => {
    render(<LinkBadge link={{ url: 'https://example.com', type: 'other', label: '' }} />);
    expect(screen.getByText('Lien')).toBeInTheDocument();
  });

  it('prefers custom label over default when provided', () => {
    render(<LinkBadge link={{ url: 'https://example.com', type: 'github', label: 'Mon Profil' }} />);
    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  });
});
