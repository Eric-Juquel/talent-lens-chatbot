import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import { ChatBubble } from '../components/ChatBubble';

describe('ChatBubble', () => {
  describe('user message', () => {
    it('shows "Vous" label', () => {
      render(<ChatBubble message={{ role: 'user', content: 'Hello world' }} />);
      expect(screen.getByText('Vous')).toBeInTheDocument();
    });

    it('renders content as plain text', () => {
      render(<ChatBubble message={{ role: 'user', content: 'Hello world' }} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('does not render markdown for user messages', () => {
      render(<ChatBubble message={{ role: 'user', content: '**not bold**' }} />);
      expect(screen.getByText('**not bold**')).toBeInTheDocument();
    });
  });

  describe('assistant message', () => {
    it('shows "Assistant" label when no candidateName', () => {
      render(<ChatBubble message={{ role: 'assistant', content: 'Response' }} />);
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('uses candidateName as label when provided', () => {
      render(
        <ChatBubble message={{ role: 'assistant', content: 'Response' }} candidateName='John Doe' />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    });

    it('renders markdown content', () => {
      render(<ChatBubble message={{ role: 'assistant', content: '**Bold text**' }} />);
      const strong = document.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('Bold text');
    });

    it('renders list items from markdown', () => {
      render(<ChatBubble message={{ role: 'assistant', content: '- Item one\n- Item two' }} />);
      expect(screen.getByText('Item one')).toBeInTheDocument();
      expect(screen.getByText('Item two')).toBeInTheDocument();
    });
  });
});
