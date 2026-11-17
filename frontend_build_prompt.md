# SafeSphere AI: UI Rebuild Master Prompt

Paste everything under "MASTER PROMPT" into your coding agent (Antigravity). Before that, read the notes below.

## Notes for you (not for the agent)

- **Theme pick: Accessible Teal.** Calm, trustworthy, 0.5rem radius, near-flat shadows, WCAG AA in light and dark, and it installs with one command.
- **Footer details are placeholders.** You haven't given contact details, so the agent is told to put them in one config file (`lib/site.ts`) with `TODO` values and never invent any.
- **Scan response shape is not guessed.** I only have your endpoint table, not the schemas. The agent is told to read `/openapi.json` and build an adapter, and to fall back to local seed data if findings are missing.
- **Brand mark:** no logo was provided, so the prompt uses a text wordmark with a placeholder shield icon.

---

# MASTER PROMPT

## 0. Role and ground rules

You are rebuilding the entire frontend of **SafeSphere AI**, a safety product that helps **public figures, creators and Page admins** find abusive comments on their Facebook Page posts, spot accounts that repeat abuse across posts, and review the findings.

This is a **demo build**. Only the Facebook connection and the post listing are real. The scan, its progress, and all findings are **simulated by the existing FastAPI backend** (and by local seed data where the backend returns nothing). The demo must still feel complete: a user can register, connect, pick posts, run a scan, watch progress, and explore results.

Rules that apply to everything:

1. **Do not modify the backend.** If the API contract does not match this prompt, stop, record the mismatch in `docs/specs/99-open-questions.md`, adapt on the frontend side, and keep going.
2. **Do not invent major decisions.** If something material is missing (copy, contact details, schemas), put a clearly marked `TODO` placeholder in one config file and list it in `99-open-questions.md`.
3. **Spec-first.** Before writing UI code, create the spec files listed in section 3 under `docs/specs/`, then build strictly from them. When a spec and your instinct disagree, the spec wins. Update the spec if you must deviate, and say why.
4. Replace the previous Antigravity UI. Keep any working API client code only if it matches section 5.

## 1. Stack

- Next.js (App Router) + TypeScript (strict), Tailwind CSS v4, shadcn/ui, lucide-react.
- TanStack Query, react-hook-form + zod.
- `motion` (Framer Motion, import from `motion/react`) for reveals and scroll-driven effects.
- `lenis` for smooth scrolling.
- `next-themes` for the light/dark toggle, `sonner` for toasts, shadcn `chart` (Recharts) for charts.
- `openapi-typescript` to generate types from the backend `/openapi.json`.
- Same-origin proxy: `next.config` rewrites `/api/*` to the FastAPI base URL. The frontend only ever calls `/api/*`. Auth is an httpOnly cookie set by the backend, so always send `credentials: "include"`. Never read or store tokens in the browser.

## 2. Design system (strict)

### Theme

Use the **Accessible Teal** shadcn theme. Install exactly with:

`npx shadcn@latest add https://shadcnthemes.com/r/accessible-teal.json`

This supplies the `:root` and `.dark` tokens (primary teal, 0.5rem radius, near-flat shadows) and fonts **Geist** (sans) and **Geist Mono**. Do not hand-edit token values except as below.

- **Bangla support:** Geist has no Bangla glyphs. Load **Noto Sans Bengali** via `next/font` and append it to the sans stack so Bangla text renders correctly, with a line-height of about 1.6 on Bangla content.
- **Mode:** light is the default. `next-themes` with `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, `disableTransitionOnChange`.
- **Not too sharp:** keep `--radius: 0.5rem`. Cards use `rounded-lg`, inputs and buttons `rounded-md`. Never use `rounded-none` or fully square corners, and never pill-shaped buttons.
- Use semantic tokens only (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). **No hard-coded hex colors** in components. Severity colors come from theme tokens: critical uses `destructive`, high uses the `warning` token, medium uses `info`, low uses `muted`. If a token is missing, add it to `globals.css` for both modes.

### Buttons (strict, the most important visual rule)

Use the stock shadcn `Button` with its default styles. **Do not restyle it.**

- Allowed sizes: `sm` (h-8) and `default` (h-9), and `icon` / `icon-sm` for icon-only. **No `lg`. No custom heights above h-9.**
- Allowed variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Small width:** buttons hug their content (`w-auto`). **No `w-full` buttons anywhere**, including forms, cards, empty states and mobile. Stack or align them instead.
- No gradients, glows, large shadows, uppercase text, bold weights above `font-medium`, or icons larger than `size-4`.
- One primary (`default`) button per view region. Everything else is `outline`, `secondary` or `ghost`.
- Hero CTAs follow the same rules: a `default` size primary plus an `outline` secondary, side by side, small.

### Layout and type

- Landing max width `max-w-6xl`, dashboard content `max-w-7xl`. Generous vertical rhythm (section padding `py-20 md:py-28`).
- Headings tight tracking, body `text-sm` to `text-base`, muted copy for secondary text. Dense but calm.
- Cards: `bg-card border` with the theme's shadow-xs at most.

### Sticky blurred header (required, landing and app)

- Fixed at the top. At scroll position 0 the background is **fully transparent**, with no border.
- After scrolling past about 8px it becomes `bg-background/60 backdrop-blur-md` with `border-b border-border/50`, so page content passes visibly (softly blurred) behind it. Transition `background-color, backdrop-filter, border-color` over 200ms.
- Provide a `-webkit-backdrop-filter` fallback and a solid `bg-background/90` fallback if `backdrop-filter` is unsupported.
- Hero content must start below the header so nothing collides.
- The same behavior applies to the dashboard top bar.

### Theme toggle

A ghost `icon-sm` button (sun/moon) in the header and the dashboard top bar. Icons cross-fade and rotate slightly (150-200ms). It must match the theme tokens in both modes and persist the choice.

## 3. Spec files you must create first

Create these under `docs/specs/`, each concise but complete, then implement from them in this order. Do not skip a file.

| File | Contents |
| --- | --- |
| `00-overview.md` | Goal, audience, scope, stack, folder structure, build order, definition of done |
| `01-design-system.md` | Section 2 expanded: tokens, fonts, radius, button rules with allowed examples and forbidden examples, header behavior, toggle, severity color mapping |
| `02-motion-and-scroll.md` | Section 4 expanded: Lenis setup, reveal variants, sticky scroll sequence, reduced-motion behavior, per-page motion budget |
| `03-landing-page.md` | Section 6: every section with copy, layout, motion |
| `04-auth.md` | Register, login, logout, session, route protection, error states |
| `05-api-and-data.md` | Section 5: endpoint table, generated types, adapter layer, query keys, mock/seed fallback rules |
| `06-dashboard-and-facebook.md` | App shell, dashboard states, Facebook connect/select/disconnect flow |
| `07-posts.md` | Posts grid, sync, selection, sticky scan bar |
| `08-scan-progress.md` | Create scan, polling, stage list, completion redirect |
| `09-results-and-reports.md` | Results tabs, charts, tables, drawer, repeat accounts, mock cases and report preview |
| `10-seed-data.md` | Seed generator rules and safety constraints |
| `11-qa-checklist.md` | Acceptance checklist from section 9 |
| `99-open-questions.md` | Anything unresolved, mismatches, TODO placeholders |

## 4. Motion and scroll

- **Smooth scroll:** one global Lenis instance (`lerp` about 0.1, wheel multiplier 1) created in a client provider, driven by `requestAnimationFrame`, and destroyed on unmount. Disable for users with `prefers-reduced-motion`. Do not apply it inside nested scroll containers such as drawers, dialogs and tables (`data-lenis-prevent`).
- **Reveals (the default effect):** a reusable `<Reveal>` component and a stagger-children variant. Fade from opacity 0 and translate Y 16-24px to rest. Duration 0.5-0.6s, ease `[0.22, 1, 0.36, 1]`, `once: true`, viewport margin `-80px`, stagger 0.06s. Use `x` slides (24px) alternately for two-column sections. No bounces, no scaling above 1.02.
- **Sticky scroll storytelling:** the "How it works" section pins a stage while the user scrolls through five steps. Each step swaps the visual and highlights its step label, driven by `useScroll` and `useTransform` on a tall container with a `sticky` inner stage. On mobile it degrades to stacked reveals.
- **Hero:** staggered entrance on load (headline, sub copy, buttons, product preview). The product preview gets a gentle parallax (at most 24px) while scrolling.
- **Dashboard motion is restrained:** page fade-in, skeleton loaders, animated progress bar, count-up on summary numbers, and chart draw-in. No scroll-jacking in the app.
- Respect `prefers-reduced-motion` everywhere: replace movement with simple fades or nothing.
- Never animate layout-shifting properties on scroll. Animate only `opacity` and `transform`.
- **Explicitly out of scope:** before/after swipe sliders.

## 5. API contract and data layer

The backend is FastAPI and exposes these endpoints. Generate types from `/openapi.json` and **read the real schemas before building the adapter layer. Do not guess response shapes.**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health`, `/health/db` | Health checks (not used by UI beyond a dev status) |
| POST | `/auth/register` | Register and create workspace |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Current user/workspace |
| GET | `/facebook/connect` | Redirects to Meta authorization |
| GET | `/facebook/callback` | Backend handles it, then returns the user to the app |
| GET | `/facebook/connection` | List Page connections (never returns tokens) |
| POST | `/facebook/select-page` | Choose a Page when several are returned |
| DELETE | `/facebook/connection?connection_id=UUID` | Disconnect a Page |
| POST | `/facebook/demo-connect` | Fictional Page (only when `FACEBOOK_MOCK=true`) |
| GET | `/posts?limit=24&offset=0` | List cached posts |
| POST | `/posts/sync` `{"mode":"latest"}` | Fetch newest Page posts |
| POST | `/posts/sync` `{"mode":"older"}` | Fetch an older batch |
| POST | `/scans` `{"post_ids":["uuid"]}` | Create a timed fictional scan |
| GET | `/scans` | Recent scans in the workspace |
| GET | `/scans/{scan_id}` | Time-based progress; after completion, fictional findings and analytics |

Implementation rules:

- **Typed client** wrapper around `fetch` with `credentials: "include"`, JSON handling, and a normalized error type. A 401 anywhere redirects to `/login`.
- **Connect Facebook is a browser navigation**, not a fetch: `window.location.href = "/api/facebook/connect"`. Handle the return to the dashboard, including `?error=` style cancelled or permission-denied outcomes, with a friendly message and a retry.
- **Adapter layer** (`lib/api/adapters.ts`) maps raw API responses to UI view-models. All components use view-models only, so schema changes touch one file.
- **Seed fallback:** if `GET /scans/{id}` returns no findings or incomplete analytics after completion, or `/facebook/connection` and `/posts` are empty in mock mode, fill the gaps from local seed data (section 8). Seed fallbacks must be deterministic (seeded by scan id and post id) so repeat visits look identical. An env flag `NEXT_PUBLIC_FORCE_SEED=true` forces seed data for everything for offline demos.
- If `FACEBOOK_MOCK=true`, show a small "Use demo Page" outline button that calls `/facebook/demo-connect`.
- TanStack Query keys: `['me']`, `['connections']`, `['posts', {limit, offset}]`, `['scans']`, `['scan', id]`. Poll `['scan', id]` every 1.5s while not completed. Stop polling on completion or error.
- Never log, display or persist tokens.

## 6. Pages

For every page build **loading (skeleton), empty, and error (with retry)** states.

### 6.1 Public landing page `/`

Sections in order, all with scroll reveals and the sticky blurred header:

1. **Hero:** a simple hook, for example "Know who is targeting your comments, before it wears you down." with one short supporting sentence, two small buttons ("Get started" primary, "See how it works" outline that smooth-scrolls to the flow section), and a product preview card (a mock results dashboard) with gentle parallax. A small "Demo" note is acceptable.
2. **What it does:** three or four feature cards: Connect your Page, Find abusive comments (Bangla, Banglish, English), Spot repeat accounts across posts, Review before you act.
3. **Who it's for:** three audience cards: **Public figures**, **Creators**, **Page admins and moderators**. Each has one line on their pain point and one on how SafeSphere helps.
4. **How it works (sticky scroll flow):** five steps with a mock visual per step: Connect Facebook, Select posts, Start the scan, Review flagged comments and repeat accounts, Prepare a report for your review. Each step also states plainly what the user needs to do.
5. **Built to be careful:** human review before any action, abusive text hidden by default, tokens stored encrypted, no public offender lists, flagged does not mean guilty, and honest notice that AI can be wrong.
6. **FAQ:** shadcn `Accordion` with 5-6 questions (what do you access, does it post or delete anything, which languages, is it a replacement for legal advice, how are tokens stored, what does a scan cost).
7. **Closing CTA:** one line and one small primary button.
8. **Footer:** brand wordmark, short description, link columns (Product, Company, Legal), **contact details**, and a copyright line. Contact details (email, phone, address, social links, team name) come only from `lib/site.ts` as `TODO` placeholders. **Never invent real-looking contact details.**

Copy tone: calm, plain, non-alarmist, no fear-mongering, no claims of guilt, no "AI catches all abusers" promises.

### 6.2 Auth `/login`, `/register`

Centered card, react-hook-form + zod, inline field errors, a server error banner, a show/hide password toggle, links between the two pages. Register creates the account and workspace and then lands on `/dashboard`. Session survives a refresh. Logout lives in the user menu. Middleware protects app routes and redirects signed-in users away from the auth pages.

### 6.3 App shell

Shadcn `Sidebar` (collapsible on mobile) with: Dashboard, Posts, Scans, Cases, Reports, Settings. Top bar with a page title, theme toggle, and a user menu. Blurred-on-scroll top bar as in section 2. Show a persistent small **Demo data** badge anywhere simulated data appears.

### 6.4 Dashboard `/dashboard`

- **No connection:** a clean empty state card with a "Connect Facebook" primary button (and "Use demo Page" when mock mode is on). Short explanation of what permissions are requested and what is not done (nothing is posted, nothing is deleted).
- **Several Pages returned:** a Page picker (`Select` or radio cards), then "Confirm" calls `/facebook/select-page`.
- **Connected:** a status card (Page name, avatar if provided, connected state, Disconnect as a `ghost` or `outline` button with a confirm dialog, calling `DELETE /facebook/connection?connection_id=...`), summary cards from the latest completed scan (comments scanned, flagged, repeat accounts, highest severity), a recent scans table, and a "Select posts to scan" call to action.

### 6.5 Posts `/posts`

Grid of post cards (thumbnail with fallback, caption snippet, date, comment count) with checkbox selection, "Select all on page", a sticky selected-count bar containing a small primary "Start scan" button, "Refresh latest" and "Load older posts" (`POST /posts/sync` with `latest` / `older`), and pagination with `limit=24&offset`. Disable Start scan with zero selection. Handle sync errors (expired token, missing permission) with a clear message.

### 6.6 Scan `/scans/[id]`

- On Start scan: `POST /scans` with `post_ids`, then navigate to `/scans/{id}`.
- **Running:** a progress card with an animated percentage bar and a stage list that animates through the four stages as the percentage advances: **Fetching comments, Analyzing text, Analyzing media, Grouping repeat accounts**. Use `aria-live="polite"`. Results stay hidden until the status is completed.
- **Completed:** auto-transition (no hard reload) to the results view in the same route with a short fade.
- **Results view (tabs):** **Overview** (summary cards, severity breakdown chart, flagged-per-post chart), **Flagged comments** (data table with filters for severity, label, post, language, plus search and pagination), **Repeat accounts** (accounts appearing across 3+ posts, with incident counts), plus a **comment detail drawer** (text, post link, label, severity, reason code, language).
- **Abusive text is blurred or hidden by default** in the table and drawer, with a small "Reveal" ghost button per item and a "Reveal all" toggle. Persist nothing about reveals.
- A visible **Demo data** badge on every results view.

### 6.7 Scans `/scans`

A history table (date, posts scanned, status, flagged count) with row click to open the scan.

### 6.8 Cases `/cases` and Reports `/reports` (UI-only mocks)

These are hardcoded mock screens that show where the product is headed. Mark them with the Demo data badge.

- **Cases:** a table of mock cases grouped by repeat account with status chips (Detected, In review, Confirmed for draft), and a detail view with a timeline of mock incidents.
- **Reports:** a mock report draft preview (title, summary, source-referenced item list, a "draft, not submitted" status stepper: Draft, Revision, Ready for approval, Approved). Any approve or submit button is disabled with a tooltip such as "Not available in the demo". Never imply anything was sent.

### 6.9 Settings `/settings`

Workspace name, connected Page with disconnect, theme toggle, and a log out button. Nothing else.

## 7. Language and content rules

UI copy is **English only**. Sample comments may be Bangla, Banglish and English. All names, handles and Pages are invented. Say "flagged" and "repeat account", never "offender" or "guilty".

## 8. Seed data (fallback and demo realism)

- Provide a deterministic generator in `lib/seed/` (seeded by scan id and post id) and hardcoded fixtures for: demo Page, 8-10 posts with captions and comment counts, scans, cases and a report draft.
- Per post: **40-80 flagged comments** in Bangla, Banglish and English.
- Labels: harassment, threat, body-shaming, sexual harassment, hate speech. Each has a severity (low, medium, high, critical) and a short reason code (for example `HARASS_REPEAT`, `THREAT_IMPLIED`).
- A handful of invented accounts that appear across **3 or more posts**, so Repeat accounts has real content.
- **Keep sample text mild and non-graphic.** It must read as clearly flagged but never contain slurs, explicit sexual content, graphic violence or real people's names. Use soft placeholders where a real example would be offensive.
- If the backend already returns findings, **use them** and only fill what is missing.

## 9. Acceptance checklist

- Register, login, refresh, logout all work, and protected routes redirect correctly.
- Connect Facebook round trip works (and the demo Page works in mock mode), including the cancelled and denied outcomes.
- Posts load, sync latest and older work, selection and select-all work, and the sticky bar shows the right count.
- Start scan leads to the progress screen, which polls, animates the four stages, and moves to results on its own.
- Results show summary cards, two charts, the filterable table, drawer, and repeat accounts, with hidden-by-default abusive text and a Demo data badge.
- Landing page has all sections, smooth scrolling, fade and slide reveals, the sticky "How it works" sequence, and the footer contact block from `lib/site.ts`.
- The header is transparent at the top and blurred translucent after scrolling, in both light and dark modes.
- **Every button is a stock shadcn `sm` or `default` size, auto width, with no `w-full`, no `lg`, and no custom styling.**
- Light and dark modes both look correct, with no hard-coded colors, and keep the rounded (not sharp) feel.
- Keyboard navigation and visible focus work everywhere, and contrast meets WCAG AA.
- `prefers-reduced-motion` disables movement.
- `tsc`, lint and build pass with no console errors. Mobile layouts work down to 375px.

## 10. Working method

1. Create the `docs/specs/` files. Stop and summarize the open questions you found.
2. Set up the project, theme, fonts, providers, Lenis, and the API client with generated types.
3. Build in this order: landing page, auth, app shell, dashboard and Facebook, posts, scan progress, results, cases and reports, settings.
4. After each page, check it against its spec and the acceptance list, then move on.
5. Finish with `11-qa-checklist.md` ticked off item by item, and list anything incomplete.
