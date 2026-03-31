import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export function ErrorPage() {
  const error = useRouteError();
  const { t } = useTranslation();

  const title = isRouteErrorResponse(error) && error.status === 404
    ? t('errors.notFound.title')
    : t('errors.generic.title');

  const description = isRouteErrorResponse(error) && error.status === 404
    ? t('errors.notFound.description')
    : t('errors.generic.description');

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center'>
      <AlertTriangle className='h-12 w-12 text-destructive' aria-hidden='true' />
      <h1 className='text-2xl font-bold text-foreground'>{title}</h1>
      <p className='text-muted-foreground'>{description}</p>
      <Link
        to='/'
        className='mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
      >
        {t('errors.generic.back')}
      </Link>
    </div>
  );
}
