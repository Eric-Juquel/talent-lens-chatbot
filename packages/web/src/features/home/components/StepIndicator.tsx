import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import type { WizardStep } from '@/shared/stores/talent.store';

interface StepIndicatorProps {
  readonly currentStep: WizardStep;
}

const STEPS: { id: WizardStep; key: string }[] = [
  { id: 1, key: 'steps.upload' },
  { id: 2, key: 'steps.analyse' },
  { id: 3, key: 'steps.chat' },
];

function getStepClass(currentStep: WizardStep, stepId: WizardStep): string {
  if (currentStep === stepId) return 'bg-primary text-primary-foreground shadow-md shadow-primary/30';
  if (currentStep > stepId) return 'bg-primary/20 text-primary';
  return 'bg-muted text-muted-foreground';
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label='Wizard steps' className='flex items-center justify-center gap-2 py-6'>
      {STEPS.map((step, i) => (
        <div key={step.id} className='flex items-center gap-2'>
          <div className='flex flex-col items-center gap-1'>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                getStepClass(currentStep, step.id),
              )}
              aria-current={currentStep === step.id ? 'step' : undefined}
            >
              {step.id}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                currentStep === step.id ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {t(step.key)}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'mb-5 h-px w-12 transition-colors',
                currentStep > step.id ? 'bg-primary/40' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
    </nav>
  );
}
