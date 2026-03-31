import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, GraduationCap, Sparkles, User, ArrowLeft } from 'lucide-react';
import { useTalentStore } from '@/shared/stores/talent.store';
import { Button } from '@/shared/components/ui/button';
import { LinkBadge } from '@/features/home/components/LinkBadge';
import { SkillCard } from '../components/SkillCard';

export default function SummaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { summaryResult, uploadResult, reset, setStep } = useTalentStore();

  // Redirect if no data
  useEffect(() => {
    if (!summaryResult) void navigate('/');
  }, [summaryResult, navigate]);

  if (!summaryResult) return null;

  const initials = summaryResult.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleBackToChat = () => {
    setStep(3);
    void navigate('/');
  };

  const handleNewAnalysis = () => {
    reset();
    void navigate('/');
  };

  return (
    <div className='mx-auto max-w-3xl px-4 py-8'>
      {/* Header */}
      <div className='mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left'>
        <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary'>
          {initials || <User className='h-7 w-7' aria-hidden='true' />}
        </div>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold text-foreground'>{summaryResult.name}</h1>
          <p className='text-sm text-muted-foreground'>{summaryResult.title}</p>
          <div className='flex flex-wrap justify-center gap-2 pt-1 sm:justify-start'>
            {summaryResult.location && (
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <MapPin className='h-3.5 w-3.5' aria-hidden='true' />
                {summaryResult.location}
              </span>
            )}
            {uploadResult?.detectedLinks.map((link) => (
              <LinkBadge key={link.url} link={link} />
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className='mb-6 rounded-xl border border-border bg-card p-5'>
        <p className='text-sm leading-relaxed text-foreground'>{summaryResult.summary}</p>
      </div>

      {/* Education */}
      {summaryResult.education && (
        <div className='mb-6 flex items-start gap-3'>
          <GraduationCap className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' aria-hidden='true' />
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              {t('summary.education')}
            </p>
            <p className='mt-0.5 text-sm text-foreground'>{summaryResult.education}</p>
          </div>
        </div>
      )}

      {/* Skills */}
      <section aria-label={t('summary.skills')} className='mb-8'>
        <h2 className='mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          {t('summary.skills')}
        </h2>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {summaryResult.skills.map((group) => (
            <SkillCard key={group.category} group={group} />
          ))}
        </div>
      </section>

      {/* AI Insight */}
      {summaryResult.aiInsight && (
        <section
          aria-label={t('summary.aiInsight')}
          className='mb-8 rounded-xl border-l-4 border-primary bg-primary/5 p-5'
        >
          <div className='mb-2 flex items-center gap-2'>
            <Sparkles className='h-4 w-4 text-primary' aria-hidden='true' />
            <h2 className='text-sm font-semibold text-primary'>{t('summary.aiInsight')}</h2>
          </div>
          <p className='text-sm leading-relaxed text-foreground'>{summaryResult.aiInsight}</p>
        </section>
      )}

      {/* Actions */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <Button onClick={handleBackToChat} variant='secondary' className='gap-2'>
          <ArrowLeft className='h-4 w-4' aria-hidden='true' />
          {t('summary.backToChat')}
        </Button>
        <Button onClick={handleNewAnalysis} variant='outline'>
          {t('summary.newAnalysis')}
        </Button>
      </div>
    </div>
  );
}
