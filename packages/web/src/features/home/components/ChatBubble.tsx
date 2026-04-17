import { memo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage } from '@/api/model/upload';

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className='mb-2 last:mb-0'>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className='mb-2 list-disc pl-4'>{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className='mb-2 list-decimal pl-4'>{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className='mb-0.5'>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className='font-semibold'>{children}</strong>,
  code: ({ children }: { children?: ReactNode }) => (
    <code className='rounded bg-black/20 px-1 py-0.5 font-mono text-xs'>{children}</code>
  ),
};

interface ChatBubbleProps {
  readonly message: ChatMessage;
  readonly candidateName?: string;
}

export const ChatBubble = memo(function ChatBubble({ message, candidateName }: ChatBubbleProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const assistantLabel = candidateName || t('chat.assistant');

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary/20' : 'bg-accent/20',
        )}
        aria-hidden='true'
      >
        {isUser ? (
          <User className='h-4 w-4 text-primary' />
        ) : (
          <Bot className='h-4 w-4 text-accent' />
        )}
      </div>

      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <span className='text-xs text-muted-foreground'>
          {isUser ? t('chat.you') : assistantLabel}
        </span>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-secondary text-secondary-foreground',
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <Markdown
              skipHtml={true}
              components={markdownComponents}
            >
              {message.content}
            </Markdown>
          )}
        </div>
      </div>
    </div>
  );
});
