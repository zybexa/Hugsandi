import { headers } from 'next/headers';

/**
 * Resolve the canonical public base URL for building asset links that go
 * out to recipients (image `src`, "View in browser", etc.).
 *
 * Preference order:
 *   1. NEXT_PUBLIC_APP_URL — explicit override, use when a custom domain is
 *      set up or you need to pin a specific URL.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — auto-provided by Vercel on production
 *      deployments, equals the current project's *.vercel.app alias
 *      (e.g. "frettabref.vercel.app") even if the request came in on an
 *      old, redirecting alias like "hugsandi.vercel.app".
 *   3. Request `host` header — last-resort fallback for local dev / preview
 *      deployments.
 */
export function getBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_APP_URL;
  if (override) return override.replace(/\/$/, '');

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}
