import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      <Header />
      <main id='main-content' className='flex-1'>
        <Outlet />
      </main>
    </div>
  );
}
