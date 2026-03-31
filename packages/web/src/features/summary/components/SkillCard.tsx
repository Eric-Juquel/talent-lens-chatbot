import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { SkillGroup } from '@/api/model/summary';

interface SkillCardProps {
  readonly group: SkillGroup;
}

export const SkillCard = memo(function SkillCard({ group }: SkillCardProps) {
  const { t } = useTranslation();
  const label = t(`summary.categories.${group.category}`, { defaultValue: group.category });

  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <h3 className='mb-3 text-sm font-semibold text-primary'>{label}</h3>
      <ul className='flex flex-col gap-2'>
        {group.items.map((item) => (
          <li key={item.name} className='flex items-center justify-between gap-2'>
            <span className='text-sm text-foreground'>{item.name}</span>
            <div className='flex gap-0.5'>
              <span className='sr-only'>{`Level ${item.level} of 3`}</span>
              {[1, 2, 3].map((lvl) => (
                <Star
                  key={lvl}
                  className={cn(
                    'h-3.5 w-3.5',
                    lvl <= item.level
                      ? 'fill-primary text-primary'
                      : 'fill-muted text-muted-foreground/30',
                  )}
                  aria-hidden='true'
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
