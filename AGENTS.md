# AGENTS.md

## Project Context
Next.js 16.1.6 (App Router) + React 19 trading education platform ("DM Trader" / "DO Academy"). All student and admin views are in Spanish (`lang="es"`).
The lead instructor is **Dayan Moraga** (profile image: `/profile-pic.jpg`).

## Technology Stack
- **Database**: PostgreSQL (Supabase) via Prisma 7.4.2 (using `@prisma/adapter-pg` pool).
- **Styling**: Tailwind CSS v4.2.1 (using `@import "tailwindcss"` and direct CSS `@theme` variables in `src/app/globals.css`).
- **Auth**: Cookie-based sessions with HMAC-SHA256 signatures via `CryptoJS` (`student_id` and `admin_session`). No JWT or NextAuth.
- **Third-Party**: Google Gemini AI (grading, news, plagiarism), Google Sheets (attendance), Vercel Blob (uploads), Nodemailer (emails).

## Key Developer Commands
- `npm run dev` — Starts local development server (port 3000)
- `npm run build` — Compiles and builds the production application
- `npm run lint` — Runs ESLint using next vital and typescript configurations
- `npx prisma db seed` — Seeds database with demo courses, students, and forum posts

## Architecture & Conventions
- **Path Alias**: Always use `@/*` to refer to folders under `src/`.
- **Scripts**: Files under `scripts/` are excluded from TS compile. Always run them using `tsx` (e.g., `npx tsx scripts/cleanup.ts`).
- **Auth Guards**: `ensureAdmin()` in `src/lib/auth-guards.ts` and the middleware bypass administrative authentication entirely when `process.env.NODE_ENV === "development"`. Do not expect real admin auth locally.
- **Admin Layout**: Admin portal routes reside in `src/app/admin/(portal)/` and share a clientside sidebar layout.

## Subagent Definitions
We employ three specialized subagents during major operations:
1. **Worker 1 (UI Foundation)**: Dedicated to layout, `globals.css`, global navigation, static pages, landing page, and student-facing homepage content.
2. **Worker 2 (Interactive & Admin)**: Dedicated to dynamic views like `CourseViewerClient`, student dashboard statistics, admin panel subpages, manual/batch AI grading modals, and text/editor components.
3. **Agent 3 (Testing & Devops)**: Validates modifications using linting and build commands. Instigates `git commit` and `git push origin dev` upon success.

## Deployment & Sync
- Major development branch is `dev`.
- Use `agent-workspace-main` agent with subagent_type "execute" for tasks that require verification, linting, and commits.
- Mandatory commit discipline: When any Agent makes changes, they MUST:
  1. Run `npm run lint && npm run build` to verify changes.
  2. Stage all changes with `git add .`
  3. Commit with a clear message in the format `feat: <description>` or `fix: <description>`
  4. Push changes (the agent tool automatically handles the branch promotion where appropriate)
- Vercel automatically deploys the code whenever a change is pushed to the `main` branch.
- Always commit all changes — never leave files unstaged.
- CRITICAL: Every editing session MUST complete ALL 4 commit steps (lint, build, stage, commit, push) before finishing — this is required for workflow completion and deployment.
