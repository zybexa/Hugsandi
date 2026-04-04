# Performance Analysis Prompt — Hugsandi Email

Analyze the Hugsandi newsletter editor codebase for speed and performance improvement opportunities. This is a Next.js 14 (App Router) application using Supabase (PostgreSQL), Resend (email delivery), and deployed on Vercel (serverless).

---

## Critical instructions

1. **This is a static code analysis.** You can read files but cannot run the app, open browser DevTools, or use React profiler. All findings must be based on reading the code. Do not suggest "check the Network tab" — instead, trace the code path to determine what requests are made.
2. **You MUST read every file before reporting on it.** Do not guess behavior from file names or architecture descriptions. Every claim must reference specific line numbers from code you have actually read.
3. **Verify before reporting.** If you believe something is a bug or inefficiency, trace the full code path to confirm. Check whether the behavior is intentional (look for comments explaining why).
4. **Only report user-perceptible improvements.** A 2ms saving on a cold function is not worth reporting. Focus on things the user would notice: faster page loads, snappier editor interactions, reduced network requests, smaller bundles.
5. **Expected scale:** ~10-50 newsletters, ~100-1000 subscribers, single admin user. Do not recommend optimizations that only matter at 100k+ rows or high concurrency.
6. **Do not suggest new dependencies or architectural rewrites** unless the measured gain is substantial. Replacing `useReducer` with Redux/Zustand, adding React Query, etc. are not performance fixes — they are preference changes.
7. **If context is limited**, complete all Tier 1 files before moving to Tier 2, and so on. A thorough analysis of the editor hot path is more valuable than a shallow scan of everything.

## Common false positives to AVOID

Do NOT report these — they have been investigated and are either intentional or negligible:

- **`window.location.href` in the editor save flow** — This is intentional. It bypasses Next.js Router Cache to ensure the dashboard shows fresh data after saving. Do not suggest `router.push()`.
- **`select('*')` on the `designs` table** — The table has 8 columns and the editor needs most of them (blocks, global_style, name, id, timestamps). Column specificity saves bytes, not milliseconds.
- **Inline boolean computations in table rows** (`isSent`, `canSend`) — These are trivial comparisons on <50 items. `React.memo` overhead would exceed savings.
- **Sequential fetch in ListsPage** (lists then subscribers) — This is a dependency chain: subscriber fetch requires the list ID from the first response. Not an avoidable waterfall without an API redesign.
- **LivePreview click listener** — `doc.open(); doc.write(); doc.close()` replaces the entire iframe document, automatically destroying old listeners. No leak.
- **Missing `.select()` specificity on small tables** (`email_lists` has 3 columns, `subscribers` has 5) — Negligible network difference.
- **DashboardPage "double fetch"** — The mount `useEffect` (line 71) and `fetchData` callback (line 56) are separate codepaths. `fetchData` is only called by the retry button and after closing the send modal. There is no double fetch on mount.
- **`cache: 'no-store'` and `?t=${Date.now()}` on fetch calls** — Intentional cache-busting. The dashboard and list pages must show current data. Do not suggest removing these.
- **`force-dynamic` on `/` and `/lists` pages** — Required because these are server components that call `cookies()` for auth. Without `force-dynamic`, Next.js would statically render them at build time, bypassing auth. Do not suggest removing it or enabling caching.

---

## Already optimized (skip these)

- `/api/newsletters` — parallel queries via `Promise.all`, precomputed `block_count`/`is_complete` columns
- `/api/webhooks/resend` — `COUNT`-only queries (`head: true`) instead of fetching all recipient rows
- `ImageGalleryPanel.tsx` — image **uploads** already batched 3 at a time with `Promise.allSettled` (but other aspects of the component — rendering, re-renders — have not been analyzed)
- `TranslationContext.tsx` — translations cached in `localStorage` with 1-minute TTL and invalidation on mutation
- `/api/send` — email batch size 25
- `/api/lists` — subscriber counts use `supabase.rpc('get_subscriber_counts')`

---

## Stack and key dependencies

- **Framework:** Next.js 14.2 (App Router, server components + client components)
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Email:** Resend SDK (`resend@6.10.0`)
- **Editor:** Custom block-based editor with drag-and-drop (`@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`)
- **Image processing:** Sharp 0.34.5 (server-side; listed in devDependencies but used at runtime in `/api/upload` — Next.js bundles it at build time)
- **CSV parsing:** PapaParse 5.5.3
- **Styling:** Tailwind CSS 3.4 with CSS custom properties for theming
- **Deployment:** Vercel (serverless functions, no edge runtime configured)

## Architecture

- **Auth:** Cookie-based sessions with HMAC. Middleware does lightweight timestamp check; server components do full validation. Single admin user, no external auth provider.
- **i18n:** Custom context-based translation system (`TranslationContext.tsx`) supporting Icelandic (default) and English, with database-stored overrides. Cached in localStorage.
- **Editor:** `useReducer`-based state management. Blocks (header, content-card, footer) rendered in `EditorCanvas` with DnD. `LivePreview` iframe renders email HTML in real time with 300ms debounce. Save is manual (no auto-save) — the PUT to `/api/designs/[id]` fires only when the user clicks Save, not on every keystroke. A typical newsletter has 3-7 blocks (1 header + 1-5 content cards + 1 footer).
- **Email rendering:** `render-email.ts` generates inline-CSS HTML from the block data structure. Used client-side (live preview) and server-side (sending, `/view/[id]`).

### Typical user workflow (for prioritization)
1. **Login** — once per session (~weekly)
2. **Dashboard** — viewed every session, scans newsletter list
3. **Editor** — main activity, 10-30 minutes per session. Typing, rearranging blocks, uploading images, previewing. This is where responsiveness matters most.
4. **Send** — infrequent (weekly/monthly), waits for completion
5. **Subscriber management** — occasional, adds/removes subscribers or imports CSV

Prioritize: editor responsiveness > dashboard/page load speed > subscriber management > send flow.

## Database schema

```
designs (id uuid PK, name text, global_style jsonb, blocks jsonb, created_at timestamptz, updated_at timestamptz, block_count int, is_complete bool)
  Indexes: designs_pkey (id)

email_lists (id uuid PK, name text, created_at timestamptz)
  Indexes: email_lists_pkey (id)

subscribers (id uuid PK, list_id uuid, email text, name text?, created_at timestamptz)
  Indexes: subscribers_pkey (id), subscribers_list_id_email_key UNIQUE (list_id, email)

newsletter_sends (id uuid PK, design_id uuid?, list_id uuid?, subject text, recipient_count int, sent_count int, failed_count int, delivered_count int, opened_count int, sent_at timestamptz)
  Indexes: newsletter_sends_pkey (id), idx_newsletter_sends_design_id (design_id)

send_recipients (id uuid PK, send_id uuid, resend_email_id text?, email text, status text, created_at timestamptz, updated_at timestamptz)
  Indexes: send_recipients_pkey (id), idx_send_recipients_send_id (send_id), idx_send_recipients_resend_email_id (resend_email_id)

design_images (id uuid PK, design_id uuid, url text, filename text, created_at timestamptz)
  Indexes: design_images_pkey (id), idx_design_images_design_id (design_id)

user_defaults (key text PK, value jsonb, updated_at timestamptz)
  Indexes: user_defaults_pkey UNIQUE (key)
  Note: This is the table behind /api/defaults — called on every page load (when localStorage cache misses). Stores language, translations, global_style, and block defaults.
```

### Foreign key constraints and cascade behavior
```
design_images.design_id  → designs.id          ON DELETE CASCADE
newsletter_sends.design_id → designs.id        ON DELETE SET NULL
newsletter_sends.list_id → email_lists.id      ON DELETE SET NULL
send_recipients.send_id → newsletter_sends.id  ON DELETE CASCADE
subscribers.list_id → email_lists.id           ON DELETE CASCADE
```

This means: deleting a design automatically deletes its `design_images` rows (CASCADE) and nullifies `newsletter_sends.design_id` (SET NULL). The code in `/api/designs/[id]` DELETE manually fetches image URLs before deleting (to clean up storage files), but does NOT need to manually delete `design_images` DB rows — the cascade handles that. Do not suggest removing the pre-delete image URL fetch; it's needed for storage cleanup.

**Important:** This Supabase instance is shared with a Payload CMS application (~50 other tables). The newsletter app uses only the 7 tables listed above. This matters for connection pooling and cold-start analysis — the database is not idle.

## Current build output (baseline)

```
Route                          Page Size  First Load JS  Type
/editor                        26.5 kB    119 kB         static (○)
/lists                         1.97 kB    94.6 kB        dynamic (ƒ)
/login                         1.34 kB    94 kB          static (○)
/translations                  1.71 kB    94.3 kB        static (○)
/view/[id]                     138 B      87.4 kB        dynamic (ƒ)
/subscribe-test                1.05 kB    88.3 kB        static (○)

Shared JS by all: 87.3 kB (chunks: 31.7 kB + 53.6 kB + 1.89 kB)
```

Note: The root `/` (dashboard) page was truncated from the build capture. It uses `DashboardPage.tsx` (client component) and is dynamic (`force-dynamic`). Its First Load JS is ~94-95 kB based on similar pages.

The `/editor` page is the largest at 119 kB first load (26.5 kB page-specific JS). All other pages are under 95 kB.

**Key insight:** The shared JS chunk (87.3 kB) dominates every page's First Load JS. Most pages add only 1-2 kB of their own JS on top. This means optimizing individual page bundles (except `/editor` at 26.5 kB) has almost no impact. The biggest wins are either reducing the shared chunk or improving how/when it loads.

## Known issue: Unused fonts loaded globally (layout.tsx)

The root layout loads 3 font families and sets CSS variables:
- `--font-geist-sans` → `GeistVF.woff` (local variable font)
- `--font-geist-mono` → `GeistMonoVF.woff` (local variable font)
- `--font-instrument-sans` → `Instrument_Sans` (Google Font, 4 weights x 2 styles)

**Confirmed: None of these CSS variables are referenced anywhere** — not in Tailwind config, not in `globals.css`, not in any component. The fonts are loaded but never applied to any element. Next.js `next/font` typically adds `<link rel="preload">` tags for imported fonts, which would cause browsers to download them regardless of use. The analyst should check the generated `@font-face` declarations and preload behavior by reading `layout.tsx` and reasoning about Next.js `next/font` mechanics — do these font imports result in preloaded files even when the CSS variables are never consumed?

---

## Files to analyze

Read and analyze every file listed below. Prioritize by user-facing impact — the editor hot path matters most, auth/CSV helpers matter least.

### Tier 1: Editor hot path (highest impact — user interacts here constantly)
- `src/app/editor/page.tsx` — Editor page with `useReducer`, design loading, save logic. How do state updates propagate? Does editing one block re-render all blocks?
- `src/components/editor/EditorCanvas.tsx` — Block list with DnD. Does every block re-render on any state change?
- `src/components/editor/BlockRenderer.tsx` — Individual block rendering. Is it memoized?
- `src/components/editor/blocks/ContentCardBlock.tsx` — Most complex block type with image, title, body, CTA fields.
- `src/components/editor/blocks/HeaderBlock.tsx` — Header block.
- `src/components/editor/blocks/FooterBlock.tsx` — Footer block.
- `src/components/editor/LivePreview.tsx` — Iframe-based live preview with 300ms debounce. Is `renderEmailHtml` called more than necessary?
- `src/components/editor/ImageGalleryPanel.tsx` — Image gallery in editor sidebar. Upload batching is already optimized, but check: does it re-render on every editor state change? Does it render all images without virtualization?
- `src/lib/render-email.ts` — Email HTML generation. How expensive is it? Is it called redundantly?

### Tier 2: Page load performance (user sees this on every navigation)
- `src/app/layout.tsx` — Root layout. See "Known issue: Unused fonts" section above.
- `src/app/globals.css` — Global styles. Any render-blocking CSS, unnecessary resets, or unused rules?
- `src/lib/i18n/TranslationContext.tsx` — Translation provider. Already cached, but check for other issues.
- `src/components/layout/AppShell.tsx` — App wrapper. Does it cause unnecessary re-renders on navigation?
- `src/components/layout/Navbar.tsx` — Navigation bar.
- `src/components/DashboardPage.tsx` — Dashboard client component.
- `src/components/ListsPage.tsx` — Subscriber list client component.
- `src/app/view/[id]/page.tsx` — Public newsletter view. Could this be statically generated or cached?

### Tier 3: API routes (affects page load and interactions)
- `src/app/api/defaults/route.ts` — Defaults CRUD. Called on every page load (when cache misses).
- `src/app/api/designs/[id]/route.ts` — Design GET/PUT/DELETE. PUT is called on every editor save.
- `src/app/api/designs/route.ts` — Design list and creation.
- `src/app/api/designs/[id]/images/route.ts` — Image association management.
- `src/app/api/upload/route.ts` — Image upload with Sharp processing.
- `src/app/api/subscribers/route.ts` — Subscriber CRUD.
- `src/app/api/subscribers/import/route.ts` — CSV import endpoint.
- `src/app/api/subscribe/route.ts` — Public subscribe endpoint.

### Tier 4: Supporting code (lower impact, check briefly)
- `src/lib/supabase.ts` — Is the Supabase client reused or created fresh per request?
- `src/lib/resend.ts` — Resend client initialization.
- `src/lib/defaults.ts` — Default block creation and saved defaults loading.
- `src/lib/password.ts` — Auth/HMAC helpers.
- `src/lib/csv-parser.ts` — CSV import logic.
- `src/app/api/auth/route.ts` — Login endpoint.
- `src/app/login/page.tsx` — Login page (used once per session).
- `src/app/translations/page.tsx` — Translation editor page. Renders a table of all translation keys — check for re-render issues with many rows.
- `middleware.ts` — Auth middleware.

### Tier 5: Config (check for misconfigurations)
- `src/types/design.ts` — Type definitions.
- `tailwind.config.ts` — Purge/content configuration, any bloat.
- `next.config.mjs` — Next.js configuration. Missing optimizations?
- `package.json` — Dependency audit. Anything heavy that could be replaced or tree-shaken?

---

## What to look for

### Editor performance (Tier 1 priority)
1. **Re-render cascades** — When the user types in one block's text field, do ALL blocks re-render? Check if `BlockRenderer` or individual block components use `React.memo`. Check if callback props (like `onDataChange`) are stable references or recreated every render.
2. **LivePreview cost** — `renderEmailHtml` runs on every design change (debounced 300ms). How expensive is this function? Could it be memoized? (Note: moving it to a web worker would require separate webpack config and `postMessage` serialization — only suggest this if the function is genuinely expensive, not as a speculative improvement.)
3. **DnD overhead** — `@dnd-kit` is generally efficient, but check: does `DndContext` wrap only the canvas or the entire editor page? Overly broad context scope can cause unnecessary re-renders in unrelated components (like LivePreview or ImageGallery) during drag operations.

### Network and loading (Tier 2 priority)
4. **Redundant fetches** — API calls made more than once for the same data, or data fetched but never used.
5. **Waterfall requests** — Sequential fetches that could run in parallel (but verify it's not a dependency chain first).
6. **Bundle size** — The editor page is 119 kB. Can any imports be dynamically loaded? Are there heavy dependencies pulled into pages that don't need them?
7. **Caching** — API responses or computations that could use HTTP cache headers, `revalidate`, or in-memory caching.

### Perceived performance (Tier 2)
8. **Loading states** — Pages currently show plain "Loading..." text. Would skeleton screens or spinners improve perceived speed?
9. **Optimistic updates** — When adding/removing subscribers or deleting newsletters, does the UI wait for the API response before updating? Optimistic local updates feel instant.

### Supporting code (Tier 4)
For Tier 4 files, the inline questions in the file list above are sufficient. Key things: Is the Supabase client a singleton or created per-request? Are any modules doing expensive initialization at import time (affecting cold starts)?

### Database (Tier 3 priority)
10. **Missing indexes** — Cross-reference queries in API routes against the index list above. Note: `subscribers(list_id, email)` already has a composite unique index, `send_recipients(send_id)` and `send_recipients(resend_email_id)` are indexed, `newsletter_sends(design_id)` is indexed, `design_images(design_id)` is indexed.
11. **Query patterns** — Any N+1 queries, unnecessary JOINs, or queries that fetch more data than needed.

### Vercel/deployment (Tier 5)
12. **Cold starts** — Serverless function cold starts on Vercel. Are any API routes importing heavy modules (e.g., Sharp) unnecessarily? Note: this Supabase instance is shared with a Payload CMS app, so the database connection is typically warm.
13. **Static generation** — Could `/view/[id]` use ISR (Incremental Static Regeneration) instead of being fully dynamic? Note: newsletters can be edited after creation, so consider the staleness trade-off.
14. **Image serving** — Are uploaded images served with proper cache headers from Supabase storage? The upload route sets `cacheControl: '3600'` — is this sufficient?
15. **Font payload** — See "Known issue" section above.

### Config (Tier 5)
16. **Image elements** — The app uses raw `<img>` tags throughout (ESLint's `@next/next/no-img-element` is disabled). This means Next.js image optimization (`next/image`) is unused. Evaluate whether switching to `<Image>` for gallery thumbnails and content card images would meaningfully reduce bytes transferred, or whether the current Sharp-based preprocessing on upload makes this unnecessary.
17. **next.config.mjs** — Check for missing configuration (e.g., `experimental` flags, headers).

---

## Output format

Group findings by priority (high / medium / low). Within each priority group, order by estimated impact (largest first). For each finding:

```
### [Priority] Title
**File(s):** `path/to/file.ts` lines X-Y (list multiple files if the issue spans a component chain, e.g., parent → child re-render cascade)
**Issue:** Specific description of what's wrong
**Impact:** Quantified effect (e.g., "causes N extra re-renders per keystroke", "adds Xms to page load", "fetches X kB unnecessarily")
**Fix:** Concrete code change or approach
**Trade-offs:** Any downsides or risks introduced by the fix (e.g., "ISR may serve stale content for up to N seconds", "adds complexity to the component"). Write "None" if the fix is purely beneficial.
```

Do not include issues that are in the "Already optimized" or "Common false positives" sections.

At the end, include a **Summary table** listing all findings in one place:

```
| # | Priority | File | Issue (short) | Effort |
|---|----------|------|---------------|--------|
| 1 | High     | ...  | ...           | Easy/Medium/Hard |
```
