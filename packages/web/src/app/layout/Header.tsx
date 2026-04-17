import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Menu, X, ScanSearch } from 'lucide-react';
import { useAppStore } from '@/shared/stores/app.store';
import { useTalentStore } from '@/shared/stores/talent.store';
import type { Locale } from '@/shared/types/common';

export function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme, locale, setLocale } = useAppStore();
  const reset = useTalentStore((s) => s.reset);
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);

  const handleNewAnalysis = useCallback(() => {
    reset();
    navigate('/');
    setMenuOpen(false);
  }, [reset, navigate]);

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === 'fr' ? 'en' : 'fr';
    setLocale(next);
    void i18n.changeLanguage(next);
  }, [locale, setLocale, i18n]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4'>
        {/* Logo */}
        <Link
          to='/'
          className='flex items-center gap-2 text-lg font-semibold text-foreground transition-opacity hover:opacity-80'
        >
          <ScanSearch className='h-5 w-5 text-primary' aria-hidden='true' />
          <span>{t('nav.title')}</span>
        </Link>

        {/* Desktop controls */}
        <nav
          aria-label={t('nav.mainLabel')}
          className='hidden items-center gap-2 md:flex'
        >
          <button
            type='button'
            onClick={handleNewAnalysis}
            className='rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            {t('nav.newAnalysis')}
          </button>

          <button
            type='button'
            onClick={toggleLocale}
            aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
            className='flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            <Globe className='h-4 w-4' aria-hidden='true' />
            {locale.toUpperCase()}
          </button>

          <button
            type='button'
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
            className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            {theme === 'dark' ? (
              <Sun className='h-4 w-4' aria-hidden='true' />
            ) : (
              <Moon className='h-4 w-4' aria-hidden='true' />
            )}
          </button>
        </nav>

        {/* Mobile burger */}
        <button
          ref={burgerRef}
          type='button'
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen}
          aria-controls='mobile-nav-menu'
          onClick={() => setMenuOpen((v) => !v)}
          className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden'
        >
          {menuOpen ? (
            <X className='h-5 w-5' aria-hidden='true' />
          ) : (
            <Menu className='h-5 w-5' aria-hidden='true' />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <dialog
          ref={menuRef}
          id='mobile-nav-menu'
          open
          aria-label={t('nav.mobileMenuLabel')}
          className='m-0 w-full max-w-none border-0 border-t border-border bg-background px-4 pb-4 pt-2 md:hidden'
        >
          <button
            type='button'
            onClick={handleNewAnalysis}
            className='flex w-full rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            {t('nav.newAnalysis')}
          </button>

          <button
            type='button'
            onClick={() => { toggleLocale(); setMenuOpen(false); }}
            className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            <Globe className='h-4 w-4' aria-hidden='true' />
            {locale === 'fr' ? 'English' : 'Français'}
          </button>

          <button
            type='button'
            onClick={() => { toggleTheme(); setMenuOpen(false); }}
            className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
          >
            {theme === 'dark' ? (
              <Sun className='h-4 w-4' aria-hidden='true' />
            ) : (
              <Moon className='h-4 w-4' aria-hidden='true' />
            )}
            {theme === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
          </button>
        </dialog>
      )}
    </header>
  );
}
