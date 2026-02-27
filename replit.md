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

The app uses a multi-page layout with wouter routing. The homepage (`client/src/pages/home.tsx`) shows shortened previews (3-4 items) of each section with "Więcej" buttons linking to dedicated subpages. Full subpages exist at `/kalendarz`, `/grupy`, `/nagrania`, `/galeria`, `/faq`. Navigation uses anchor scrolling within the homepage and links to subpages.

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
  - `POST /api/admin/login` — admin password authentication
  - `GET /api/admin/session` — check admin session
  - `POST /api/admin/logout` — admin logout
  - `GET/PUT/DELETE /api/admin/manual-verse` — manual weekly verse override
  - `POST /api/upload` — file upload for images (10 MB limit)
  - `POST /api/upload-video` — video upload for hero section (200 MB limit)
  - `GET/PUT /api/admin/settings/:key` — generic admin settings read/write
- **Auth:** Session-based with bcrypt password hashing, connect-pg-simple session store
- **Default admin password:** `admin123` (auto-seeded on first run)
- **Seeding:** The server auto-seeds sample data and default admin password on first run if the database is empty

### Data Storage
- **Database:** PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location:** `shared/schema.ts` — shared between client and server
- **Migration tool:** Drizzle Kit (`npm run db:push` for schema push)
- **Tables:** `news`, `events`, `groups`, `recordings`, `faq`, `contact_info`, `galleries`, `admin_settings`
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

## External Dependencies

### Database
- **PostgreSQL** — primary data store, connected via `DATABASE_URL` environment variable

### Third-Party Services
- **Google Fonts** — DM Sans, Fraunces, and Inter font families loaded from `fonts.googleapis.com`
- **YouTube RSS** — auto-pulls latest videos from channel `UCYwTmxRhm2hZDWkeEZngc4g` via RSS feed (`rss-parser`); no API key required; results cached 30 min
- **Google Calendar** — embedded iframe from `peajawornik@gmail.com`; admin can override URL via `google_calendar_url` setting
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
- **connect-pg-simple** — PostgreSQL session store (available but sessions not currently used)