'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TranslationProvider, useTranslation } from '@/lib/i18n';
import Navbar from './Navbar';

const NO_NAVBAR_ROUTES = ['/login', '/view'];
const MIN_WIDTH = 1100;

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, t } = useTranslation();
  const hideNavbar = NO_NAVBAR_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicPage = hideNavbar;

  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    function check() { setTooSmall(window.innerWidth < MIN_WIDTH); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!ready) return null;

  if (tooSmall && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 text-center text-skin-text-secondary">
        <p className="text-lg">{t('screen.tooSmall')}</p>
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <AppContent>{children}</AppContent>
    </TranslationProvider>
  );
}
