'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TranslationProvider, useTranslation } from '@/lib/i18n';
import Navbar from './Navbar';

const NO_NAVBAR_ROUTES = ['/login', '/view'];
const PUBLIC_ROUTES = ['/login', '/view', '/subscribe-test'];

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useTranslation();
  const hideNavbar = NO_NAVBAR_ROUTES.some((route) => pathname.startsWith(route));

  // Client-side auth check as fallback for static page serving
  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    if (isPublic) return;
    fetch('/api/defaults', { credentials: 'same-origin' }).then((res) => {
      if (res.redirected || res.status === 401) {
        window.location.href = '/login';
      }
    }).catch(() => {});
  }, [pathname]);

  if (!ready) return null;

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
