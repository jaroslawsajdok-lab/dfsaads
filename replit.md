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

The app is a single-page layout — the homepage (`client/src/pages/home.tsx`) contains all sections: hero video, news, calendar, groups, recordings, galleries, FAQ, guest house link, and contact. Navigation uses anchor scrolling within the page.

### Backend
- **Runtime:** Node.js with TypeScript (tsx for dev, esbuild for production)
- **Framework:** Express 5
- **API Pattern:** RESTful JSON API under `/api/*` prefix
- **Endpoints:**
  - `GET /api/news` — parish news/announcements
  - `GET /api/events` — calendar events
  - `GET /api/groups` — parish groups
  - `GET /api/recordings` — YouTube sermon recordings
  - `GET /api/faq` — frequently asked questions
  - `GET /api/contact` — contact information
  - `GET /api/galleries` — photo galleries
  - Corresponding `POST` endpoints for creating new entries
- **Seeding:** The server auto-seeds sample data on first run if the database is empty

### Data Storage
- **Database:** PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location:** `shared/schema.ts` — shared between client and server
- **Migration tool:** Drizzle Kit (`npm run db:push` for schema push)
- **Tables:** `news`, `events`, `groups`, `recordings`, `faq`, `contact_info`, `galleries`
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
2. **No authentication** — this is a public-facing parish website; content is managed through API/database
3. **Auto-seeding** — sample content is inserted on first run so the site works immediately
4. **Polish language** — all UI text and content is in Polish
5. **Glassmorphism UI** — modern visual style with translucent blur effects, especially in the sticky navigation header
6. **Fullscreen video hero** — the landing section features an autoplay drone video with fallback poster image

## External Dependencies

### Database
- **PostgreSQL** — primary data store, connected via `DATABASE_URL` environment variable

### Third-Party Services
- **Google Fonts** — DM Sans, Fraunces, and Inter font families loaded from `fonts.googleapis.com`
- **YouTube** — parish sermon recordings link to the YouTube channel `@parafiae-awisajawornik2251`
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