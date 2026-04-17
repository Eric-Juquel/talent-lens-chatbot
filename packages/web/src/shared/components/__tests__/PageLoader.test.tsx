import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { PageLoader } from '../PageLoader';

describe('PageLoader', () => {
  it('renders with role="status"', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has an accessible "Loading page" label', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status', { name: /loading page/i })).toBeInTheDocument();
  });
});
