import { Code2, Link2, Globe, ExternalLink } from 'lucide-react';
import type { DetectedLink } from '@/api/model/upload';

const ICONS = {
  github: Code2,
  linkedin: Link2,
  portfolio: Globe,
  other: ExternalLink,
} as const;

const LABELS = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio',
  other: 'Lien',
} as const;

interface LinkBadgeProps {
  readonly link: DetectedLink;
}

export function LinkBadge({ link }: LinkBadgeProps) {
  const Icon = ICONS[link.type] ?? Globe;

  return (
    <a
      href={link.url}
      target='_blank'
      rel='noopener noreferrer'
      className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
    >
      <Icon className='h-3.5 w-3.5' aria-hidden='true' />
      <span>{link.label || LABELS[link.type]}</span>
    </a>
  );
}
