import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/msw/server';
import { useTalentStore } from '@/shared/stores/talent.store';
import HomePage from '../pages/HomePage';

const API_URL = import.meta.env.VITE_API_BASE_URL;

beforeEach(() => {
  useTalentStore.getState().reset();
});

// ─── Step 1: Upload UI ───────────────────────────────────────────────────────

describe('HomePage — Step 1 (Upload)', () => {
  it('renders the wizard step indicator', () => {
    render(<HomePage />);
    expect(screen.getByRole('navigation', { name: /wizard steps/i })).toBeInTheDocument();
  });

  it('renders the upload title', () => {
    render(<HomePage />);
    expect(screen.getByText('Analysez un profil candidat')).toBeInTheDocument();
  });

  it('renders three dropzones (CV, letter, LinkedIn)', () => {
    render(<HomePage />);
    expect(screen.getByText('CV')).toBeInTheDocument();
    expect(screen.getByText('Lettre de motivation')).toBeInTheDocument();
    expect(screen.getByText('Profil LinkedIn (PDF)')).toBeInTheDocument();
  });

  it('analyze button is disabled when no CV selected', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /analyser le profil/i })).toBeDisabled();
  });

  it('analyze button is enabled after a CV file is selected', async () => {
    const { container } = render(<HomePage />);
    const cvInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await userEvent.upload(cvInput, new File([''], 'cv.pdf', { type: 'application/pdf' }));

    expect(screen.getByRole('button', { name: /analyser le profil/i })).not.toBeDisabled();
  });
});

// ─── Step 1 → Step 3: Full upload flow ─────────────────────────────────────

describe('HomePage — Upload flow (Step 1 → Step 3)', () => {
  it('transitions to chat UI after successful upload', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomePage />);

    const cvInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await userEvent.upload(cvInput, new File([''], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: /analyser le profil/i }));

    await waitFor(() => {
      expect(screen.getByText('Interrogez le profil')).toBeInTheDocument();
    });
  });

  it('shows greeting message in chat after upload', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomePage />);

    const cvInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await userEvent.upload(cvInput, new File([''], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: /analyser le profil/i }));

    await waitFor(() => {
      expect(screen.getByText(/bonjour/i)).toBeInTheDocument();
    });
  });

  it('resets to step 1 when upload fails', async () => {
    server.use(
      http.post(`${API_URL}/upload`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    const { container } = render(<HomePage />);

    const cvInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await userEvent.upload(cvInput, new File([''], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: /analyser le profil/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyser le profil/i })).toBeInTheDocument();
    });
  });

  it('shows error toast when upload fails', async () => {
    server.use(
      http.post(`${API_URL}/upload`, () =>
        HttpResponse.json({ message: 'Erreur serveur' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    const { container } = render(<HomePage />);

    const cvInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    await userEvent.upload(cvInput, new File([''], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: /analyser le profil/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });
  });
});

// ─── Step 2: Analysis loading ────────────────────────────────────────────────

describe('HomePage — Step 2 (Analysis)', () => {
  it('shows loading status when uploading', () => {
    useTalentStore.setState({ step: 2, uploadResult: null });
    render(<HomePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders "Analyse du profil" title', () => {
    useTalentStore.setState({ step: 2, uploadResult: null });
    render(<HomePage />);
    expect(screen.getByText('Analyse du profil')).toBeInTheDocument();
  });

  it('shows detected links when uploadResult is available', () => {
    useTalentStore.setState({
      step: 2,
      uploadResult: {
        cv: 'CV text',
        letter: '',
        linkedin: '',
        detectedLinks: [{ label: 'GitHub', url: 'https://github.com/user', type: 'github' }],
        candidateName: 'John',
      },
    });
    render(<HomePage />);
    expect(screen.getByText('Liens détectés')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });

  it('shows "no links" message when detectedLinks is empty', () => {
    useTalentStore.setState({
      step: 2,
      uploadResult: {
        cv: 'CV text',
        letter: '',
        linkedin: '',
        detectedLinks: [],
        candidateName: 'John',
      },
    });
    render(<HomePage />);
    expect(screen.getByText(/aucun lien détecté/i)).toBeInTheDocument();
  });
});

// ─── Step 3: Chat UI ─────────────────────────────────────────────────────────

describe('HomePage — Step 3 (Chat)', () => {
  const uploadResult = {
    cv: 'CV content',
    letter: '',
    linkedin: '',
    detectedLinks: [{ label: 'GitHub', url: 'https://github.com/jd', type: 'github' as const }],
    candidateName: 'John Doe',
  };

  beforeEach(() => {
    useTalentStore.setState({
      step: 3,
      uploadResult,
      chatHistory: [{ role: 'assistant', content: 'Bonjour !' }],
      summaryResult: null,
    });
  });

  it('renders the chat title', () => {
    render(<HomePage />);
    expect(screen.getByText('Interrogez le profil')).toBeInTheDocument();
  });

  it('renders detected links as badges', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });

  it('renders existing chat history messages', () => {
    render(<HomePage />);
    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
  });

  it('send button is disabled when message input is empty', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled();
  });

  it('send button becomes enabled when user types a message', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.type(screen.getByPlaceholderText(/ex : quelles/i), 'Test');
    expect(screen.getByRole('button', { name: /envoyer/i })).not.toBeDisabled();
  });

  it('displays user message after sending', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/ex : quelles/i);
    await user.type(textarea, 'Quelles sont vos compétences ?');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => {
      expect(screen.getByText('Quelles sont vos compétences ?')).toBeInTheDocument();
    });
  });

  it('displays assistant reply after sending', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.type(screen.getByPlaceholderText(/ex : quelles/i), 'Test question');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => {
      expect(screen.getByText(/john doe has 5 years/i)).toBeInTheDocument();
    });
  });

  it('sends message on Enter key (without shift)', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/ex : quelles/i);
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('does not send message on Shift+Enter (adds newline)', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/ex : quelles/i);
    await user.type(textarea, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(textarea).toHaveValue('Line 1\n');
  });

  it('shows error toast when chat API fails', async () => {
    server.use(
      http.post(`${API_URL}/chat`, () =>
        HttpResponse.json({ message: 'Chat service unavailable' }, { status: 503 })
      )
    );

    const user = userEvent.setup();
    render(<HomePage />);

    await user.type(screen.getByPlaceholderText(/ex : quelles/i), 'Test');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => {
      expect(screen.getByText('Chat service unavailable')).toBeInTheDocument();
    });
  });

  it('navigates to /summary when summaryResult already exists', async () => {
    useTalentStore.setState({
      step: 3,
      uploadResult,
      chatHistory: [],
      summaryResult: {
        name: 'John',
        title: 'Dev',
        location: '',
        summary: 'Good dev',
        education: '',
        skills: [],
        aiInsight: '',
      },
    });

    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: /voir la synthèse/i }));
  });

  it('generates summary and navigates when summaryResult is null', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: /voir la synthèse/i }));

    await waitFor(() => {
      expect(useTalentStore.getState().summaryResult).not.toBeNull();
    });
  });

  it('shows error toast when summary generation fails', async () => {
    server.use(
      http.post(`${API_URL}/summary`, () =>
        HttpResponse.json({ message: 'Summary error' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: /voir la synthèse/i }));

    await waitFor(() => {
      expect(screen.getByText('Summary error')).toBeInTheDocument();
    });
  });
});
