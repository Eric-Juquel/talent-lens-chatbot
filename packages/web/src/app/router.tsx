import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorPage } from './error-handling/ErrorPage';
import { NotFoundPage } from './error-handling/NotFoundPage';
import { PageLoader } from '@/shared/components/PageLoader';

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const SummaryPage = lazy(() => import('@/features/summary/pages/SummaryPage'));

function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <SuspenseOutlet />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'summary', element: <SummaryPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
