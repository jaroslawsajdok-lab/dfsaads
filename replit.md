# Parafia Ewangelicka w Wiśle Jaworniku — Parish Website

## Overview

This is a modern parish website for "Parafia Ewangelicka w Wiśle Jaworniku" (Evangelical Parish in Wisła Jawornik, Poland). It's a full-stack single-page application that presents parish information including news, events calendar, parish groups, sermon recordings, photo galleries, FAQ, and contact details. The homepage features a fullscreen drone video hero section with glassmorphism navigation, smooth scroll animations, and a clean modern design with Polish-language content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin) with CSS variables for theming
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Animations:** Framer Motion for scroll animations and transitions
- **Typography:** Google Fonts — DM Sans (body), Fraunces (display/headings), Inter
- **Build Tool:** Vite with React plugin
- **Path aliases:** `@/*` maps to `client/src/*`, `@shared/*` maps to `shared/*`, `@assets` maps to `attached_assets/`

The app is a true single-page application. All content lives on the homepage (`client/src/pages/home.tsx`). "Więcej" buttons open full-screen modals instead of navigating to separate pages. The only routes are `/` (homepage), `/bezpieczenstwo` (admin panel), and a 404 fallback. Each section component fetches its own data via TanStack Query (no prop drilling from home.tsx). The footer navigation uses `scrollToId()` to scroll to sections on the homepage. PosterBannerStrip is rendered inside VideoHero. Old subpage files (`kalendarz.tsx`, `grupy.tsx`, `nagrania.tsx`, `galeria.tsx`, `faq-page.tsx`) are no longer routed but kept as reference.

### Backend
- **Runtime:** Node.js with TypeScript (tsx for dev, esbuild for production)
- **Framework:** Express 5
- **API Pattern:** RESTful JSON API under `/api/*` prefix
- **Endpoints:** Full REST CRUD for all entities:
  - `GET/POST/PUT/DELETE /api/news` — parish news/announcements
  - `GET/POST/PUT/DELETE /api/events` — calendar events
  - `GET/POST/PUT/DELETE /api/groups` — parish groups
  - `GET/POST/PUT/DELETE /api/recordings` — YouTube sermon recordings
  - `GET/POST/PUT/DELETE /api/faq` — frequently asked questions
  - `GET/POST/PUT/DELETE /api/contact` — contact information
  - `GET/POST/PUT/DELETE /api/galleries` — photo galleries
  - `POST /api/admin/login` — email+password → authenticated session (password-only, no 2FA)
  - `GET /api/admin/session` — check admin session (includes role, email)
  - `POST /api/admin/logout` — admin logout
  - `GET/POST/PUT/DELETE /api/admin/users` — admin user management (super_admin only)
  - `PUT /api/admin/change-password` — change own password
  - `GET/PUT/DELETE /api/admin/manual-verse` — manual weekly verse override
  - `POST /api/upload` — file upload for images (10 MB limit, MIME+magic bytes validated: JPEG/PNG/WebP/GIF)
  - `POST /api/upload-video` — video upload for hero section (50 MB limit, MIME+magic bytes validated: MP4/WebM)
  - `GET/PUT /api/admin/settings/:key` — generic admin settings read/write
- **Auth:** Password-only login with bcrypt hashing. Session-based with PostgreSQL session store (connect-pg-simple). Rate limited: 5 login attempts per minute per IP. No 2FA (email verification removed).
- **Admin Roles:** `super_admin` (jaroslawsajdok@gmail.com) has full access including user management; `admin` (marcin.podzorski@gmail.com) can edit content only
- **Default admin password:** `admin123` (auto-seeded on first run for both users)
- **Upload security:** MIME type whitelist + magic bytes validation for all uploads. Files served with `Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff` headers.
- **Seeding:** The server auto-seeds sample data, default admin password, and admin users on first run if the database is empty

### Data Storage
- **Database:** PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location:** `shared/schema.ts` — shared between client and server
- **Migration tool:** Drizzle Kit (`npm run db:push` for schema push)
- **Tables:** `news`, `events`, `groups`, `recordings`, `faq`, `contact_info`, `galleries`, `admin_settings`, `files`, `admin_users`, `session`
- **Connection:** `pg` (node-postgres) pool

### Shared Code
The `shared/` directory contains the database schema and Zod validation schemas that are used by both frontend (for TypeScript types) and backend (for database operations and input validation).

### Build & Development
- **Dev mode:** `npm run dev` starts the Express server with Vite middleware for HMR
- **Production build:** `npm run build` compiles the client with Vite and bundles the server with esbuild into `dist/`
- **Production start:** `npm run start` serves the built app from `dist/`
- **Type checking:** `npm run check` runs TypeScript compiler

### Key Design Decisions
1. **Monorepo structure** (client/server/shared) — simplifies type sharing and deployment as a single unit
2. **Admin inline editing** — password-protected admin mode allows clicking directly on text/images to edit in place; floating admin bar shows when edit mode is active
3. **Auto-seeding** — sample content is inserted on first run so the site works immediately
4. **Polish language** — all UI text and content is in Polish
5. **Glassmorphism UI** — modern visual style with translucent blur effects, especially in the sticky navigation header
6. **Fullscreen video hero** — the landing section features an autoplay drone video with fallback poster image
7. **Splash screen** — animated loading screen with parish cross logo on app load (framer-motion, 2s duration, fade-out)
8. **Przelewy24 placeholder** — hidden donation section prepared for future P24 integration; visible only in admin mode
18. **Dom Gościnny photo galleries** — each DomCardModal (Pokoje, Kuchnia, Wspomnienia) has its own image gallery stored as a JSON array in admin_settings (keys: `dom_pokoje_images`, `dom_kuchnia_images`, `dom_wspomnienia_images`); admin can upload/delete photos in edit mode; descriptions support `[text](url)` markdown links rendered as `<a>` elements
19. **Poster strip link_url** — `posters` table has `link_url` column; clicking a poster without edit mode opens the external URL if set, otherwise opens the lightbox; edit mode lightbox has "Dodaj link" / "Zmień link" button to save the URL; link indicator badge shown on poster thumbnail
20. **Remont card removed** — the amber Remont card and `RemontModal` have been removed from SectionDomGoscinny
21. **FeaturedEventPoster removed** — the event poster block has been removed from SectionKalendarz; event poster functionality now lives only in the poster strip at the bottom of the video hero
9. **Database file storage** — uploaded images/videos are stored as base64 in PostgreSQL `files` table (not on disk), served via `GET /api/files/:id` with MIME allowlist and cache headers; survives ephemeral filesystem restarts
10. **Accessibility panel** — floating bottom-left button opens panel with font size (normal/large/largest), high contrast, and underline links toggles; preferences saved to localStorage; CSS classes applied to `<html>` element
11. **Dark mode** — moon/sun toggle in accessibility panel; persists to `localStorage("dark_mode")`; defaults to light mode (dark only when manually toggled); uses Tailwind `.dark` class on `<html>`; all components use semantic tokens (`bg-card`, `bg-muted`, `text-foreground`, etc.) for full dark mode support; sections use alternating `bg-background`/`bg-muted` backgrounds applied dynamically in `home.tsx`
12. **Gallery lightbox** — full-screen photo viewer with keyboard navigation (arrow keys, Escape); reusable `GalleryLightbox` component used on both homepage preview and `/galeria` subpage
13. **Gallery multi-upload** — admin can upload multiple photos at once; homepage section and subpage both support batch uploading
14. **Configurable social links** — Facebook and YouTube URLs stored as admin settings (`facebook_url`, `youtube_url`); editable from admin floating bar; used in Aktualności section, Nagrania section, contact section, and footer
15. **Reduced motion support** — `useReducedMotion()` hook respects `prefers-reduced-motion` media query; used in lightbox animations
16. **Security hardening** — Helmet middleware (XSS, clickjacking, MIME sniffing protection), global API rate limiting (120 req/min per IP via express-rate-limit), upload rate limiting (10 req/min), 1MB JSON body limit, robots.txt blocking admin/file paths, MIME+magic bytes upload validation, CSP sandbox on served files
17. **Performance optimization** — gzip compression middleware, sharp image compression (auto WebP at upload, quality 80, max 1920px), LRU file cache in RAM (50MB, 80 files max), ETag + 304 Not Modified for zero-transfer cache revalidation, 7-day Cache-Control with must-revalidate

## External Dependencies

### Database
- **PostgreSQL** — primary data store, connected via `DATABASE_URL` environment variable

### Third-Party Services
- **Google Fonts** — DM Sans, Fraunces, and Inter font families loaded from `fonts.googleapis.com`
- **YouTube RSS** — auto-pulls latest videos from channel `UCYwTmxRhm2hZDWkeEZngc4g` via RSS feed (`rss-parser`); no API key required; results cached 30 min
- **Google Calendar iCal** — fetches upcoming events from `peajawornik@gmail.com` iCal feed via `node-ical`; parses RRULE recurrences; cached 30 min; `GET /api/calendar-events` returns nearest 6 events; embedded iframe also shown; admin can override URL via `google_calendar_url` setting
- **Google Maps** — embedded map showing parish building in contact section
- **Facebook Graph API** — fetches page posts via `FACEBOOK_PAGE_TOKEN`; page matched by `FB_PAGE_SLUG` env var (default: "wislajawornik"); falls back to iframe embed widget when token expired/missing
- **Guest House link** — external link to `https://osrodek.jawornik.eu`

### Key NPM Dependencies
- **Drizzle ORM + drizzle-zod** — database ORM and schema validation
- **Express 5** — HTTP server
- **React + React DOM** — UI framework
- **TanStack React Query** — data fetching/caching
- **Framer Motion** — animations
- **Radix UI** — accessible UI primitives (via shadcn/ui)
- **Wouter** — client-side routing
- **Zod** — schema validation
- **connect-pg-simple** — PostgreSQL session store for persistent admin sessions
- **nodemailer** — sends verification code emails via Gmail SMTP
- **node-ical** — iCal/ICS parser for Google Calendar event feed
- **helmet** — security headers middleware
- **compression** — gzip compression middleware
- **express-rate-limit** — API rate limiting
- **sharp** — image compression (WebP conversion at upload)