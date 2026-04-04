'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function Navbar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [lightMode, setLightMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: '/', label: t('nav.newsletters') },
    { href: '/lists', label: t('nav.lists') },
  ];

  // Theme: read from localStorage on mount
  useEffect(() => {
    setLightMode(localStorage.getItem('hugsandi_theme') === 'light');
  }, []);

  // Theme: apply class + persist
  useEffect(() => {
    document.documentElement.classList.toggle('light', lightMode);
    localStorage.setItem('hugsandi_theme', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dropdownOpen]);

  const isEditor = pathname === '/editor';

  return (
    <nav className="flex items-center justify-between px-6 h-16 bg-[var(--bg-secondary)] border-b border-skin-border-ui sticky top-0 z-[100]">
      {/* Brand */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <img
            src={lightMode ? '/logo-dark.png' : '/logo-white.png'}
            alt="Hugsandi"
            className="h-8 object-contain"
          />
        </Link>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1 ml-8 mr-auto">
        {navLinks.map((link) => {
          const isActive = !isEditor && pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`px-3.5 py-1.5 text-[0.8rem] font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-skin-accent text-white'
                  : 'text-skin-text-secondary hover:bg-skin-tertiary hover:text-skin-text-primary'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'is' : 'en')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-skin-border bg-skin-tertiary text-skin-text-secondary hover:bg-skin-elevated hover:text-skin-text-primary hover:border-skin-border-ui transition-colors"
          aria-label={lang === 'en' ? 'Skipta yfir í íslensku' : 'Switch to English'}
          title={lang === 'en' ? 'Íslenska' : 'English'}
        >
          <span className="text-xs font-bold">{lang === 'en' ? 'IS' : 'EN'}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setLightMode(!lightMode)}
          aria-label={lightMode ? t('nav.switchToDark') : t('nav.switchToLight')}
          title={lightMode ? t('nav.switchToDark') : t('nav.switchToLight')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-skin-border bg-skin-tertiary text-skin-text-secondary hover:bg-skin-elevated hover:text-skin-text-primary hover:border-skin-border-ui transition-all"
        >
          {lightMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label={t('nav.userMenu')}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            className="w-8 h-8 rounded-full bg-skin-accent text-white flex items-center justify-center text-xs font-bold tracking-[0.02em] cursor-pointer border-none transition-all hover:shadow-[0_0_0_2px_var(--bg-primary),0_0_0_4px_var(--accent-ring)] hover:scale-105"
          >
            E
          </button>
          {dropdownOpen && (
            <div
              className="absolute top-[calc(100%+0.5rem)] right-0 min-w-[180px] bg-[var(--bg-secondary)] border border-skin-border rounded-[10px] shadow-skin-elevated z-[200] overflow-hidden"
              style={{ animation: 'dropdownOpen 0.15s ease' }}
              role="menu"
            >
              <div className="px-4 py-3 text-xs text-skin-text-secondary border-b border-skin-border truncate">
                {t('nav.admin')}
              </div>
              <a
                href="/translations"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="block w-full px-4 py-2.5 text-[0.8rem] text-skin-text-primary text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-skin-tertiary"
              >
                {t('nav.translations')}
              </a>
              <button
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  document.cookie = 'hugsandi_session=; path=/; max-age=0';
                  window.location.href = '/login';
                }}
                className="block w-full px-4 py-2.5 text-[0.8rem] text-skin-text-primary text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-skin-tertiary"
              >
                {t('nav.logOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
