import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center'>
      <SearchX className='h-12 w-12 text-muted-foreground' aria-hidden='true' />
      <h1 className='text-2xl font-bold text-foreground'>{t('errors.notFound.title')}</h1>
      <p className='text-muted-foreground'>{t('errors.notFound.description')}</p>
      <Link
        to='/'
        className='mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
      >
        {t('errors.notFound.back')}
      </Link>
    </div>
  );
}
