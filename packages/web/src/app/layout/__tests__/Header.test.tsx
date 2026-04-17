import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/shared/stores/app.store';
import { useTalentStore } from '@/shared/stores/talent.store';
import i18n from '@/i18n/config';
import { Header } from '../Header';

beforeEach(async () => {
  await i18n.changeLanguage('fr');
  useAppStore.setState({ theme: 'dark', locale: 'fr' });
  useTalentStore.getState().reset();
});

describe('Header', () => {
  it('renders the TalentLens logo link', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /talentlens/i })).toBeInTheDocument();
  });

  it('renders "Nouvelle analyse" button in desktop nav', () => {
    render(<Header />);
    const buttons = screen.getAllByText('Nouvelle analyse');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows locale "FR" label in desktop nav', () => {
    render(<Header />);
    expect(screen.getByText('FR')).toBeInTheDocument();
  });

  it('shows theme toggle button for dark mode (switch to light)', () => {
    useAppStore.setState({ theme: 'dark', locale: 'fr' });
    render(<Header />);
    expect(screen.getByRole('button', { name: /passer en mode clair/i })).toBeInTheDocument();
  });

  it('shows theme toggle button for light mode (switch to dark)', () => {
    useAppStore.setState({ theme: 'light', locale: 'fr' });
    render(<Header />);
    expect(screen.getByRole('button', { name: /passer en mode sombre/i })).toBeInTheDocument();
  });

  it('toggles theme from dark to light on click', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ theme: 'dark', locale: 'fr' });
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /passer en mode clair/i }));
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('toggles locale from FR to EN', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /switch to english/i }));
    expect(useAppStore.getState().locale).toBe('en');
  });

  it('opens mobile menu on burger click', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes mobile menu when clicking outside the menu', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    // Fire mousedown on document body (outside the menu) to trigger outside-click handler
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu and changes locale when locale button clicked in mobile menu', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }));
    await user.click(screen.getByText('English'));
    expect(useAppStore.getState().locale).toBe('en');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resets store when "Nouvelle analyse" is clicked', async () => {
    const user = userEvent.setup();
    useTalentStore.setState({ step: 3 });
    render(<Header />);

    const buttons = screen.getAllByText('Nouvelle analyse');
    await user.click(buttons[0]);
    expect(useTalentStore.getState().step).toBe(1);
  });
});
