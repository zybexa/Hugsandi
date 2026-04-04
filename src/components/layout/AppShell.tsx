'use client';

import { usePathname } from 'next/navigation';
import { TranslationProvider } from '@/lib/i18n';
import Navbar from './Navbar';

const NO_NAVBAR_ROUTES = ['/login', '/view'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = NO_NAVBAR_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <TranslationProvider>
      {!hideNavbar && <Navbar />}
      {children}
    </TranslationProvider>
  );
}
