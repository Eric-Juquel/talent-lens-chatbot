import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../app.store';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ theme: 'dark', locale: 'fr' });
});

describe('useAppStore', () => {
  describe('initial state', () => {
    it('has dark theme', () => {
      expect(useAppStore.getState().theme).toBe('dark');
    });

    it('has fr locale', () => {
      expect(useAppStore.getState().locale).toBe('fr');
    });
  });

  describe('setTheme', () => {
    it('sets theme to light', () => {
      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().theme).toBe('light');
    });

    it('applies "dark" class to document root for dark theme', () => {
      useAppStore.getState().setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes "dark" class from document root for light theme', () => {
      useAppStore.getState().setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('switches from dark to light', () => {
      useAppStore.setState({ theme: 'dark', locale: 'fr' });
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
    });

    it('switches from light to dark', () => {
      useAppStore.setState({ theme: 'light', locale: 'fr' });
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });

  describe('setLocale', () => {
    it('updates locale to en', () => {
      useAppStore.getState().setLocale('en');
      expect(useAppStore.getState().locale).toBe('en');
    });

    it('updates locale back to fr', () => {
      useAppStore.setState({ theme: 'dark', locale: 'en' });
      useAppStore.getState().setLocale('fr');
      expect(useAppStore.getState().locale).toBe('fr');
    });
  });
});
