import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { StepIndicator } from '../components/StepIndicator';

describe('StepIndicator', () => {
  it('renders nav landmark with wizard steps label', () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByRole('navigation', { name: /wizard steps/i })).toBeInTheDocument();
  });

  it('renders all 3 step numbers', () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders i18n step labels', () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Analyse')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(<StepIndicator currentStep={2} />);
    const currentEl = document.querySelector('[aria-current="step"]');
    expect(currentEl).toBeInTheDocument();
    expect(currentEl?.textContent).toBe('2');
  });

  it('does not set aria-current on non-current steps', () => {
    render(<StepIndicator currentStep={1} />);
    const allCurrentEls = document.querySelectorAll('[aria-current="step"]');
    expect(allCurrentEls).toHaveLength(1);
  });

  it('changes aria-current when currentStep changes', () => {
    const { rerender } = render(<StepIndicator currentStep={1} />);
    expect(document.querySelector('[aria-current="step"]')?.textContent).toBe('1');

    rerender(<StepIndicator currentStep={3} />);
    expect(document.querySelector('[aria-current="step"]')?.textContent).toBe('3');
  });
});
