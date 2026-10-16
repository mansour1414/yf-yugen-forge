# YF-YUGEN FORGE — Project Instructions

> Last reviewed: 2026-09-08 (Claude audit). This file previously described a
> "5-layer design ecosystem" (Tailwind CSS, Impeccable, taste-skill,
> UI UX Pro Max, motion/framer-motion/vaul) that **does not exist in this
> project**. None of those packages are in `package.json`, no `.claude/`
> skills directory or `.impeccable/` config exists, and there is no
> `tailwind.config.*` anywhere in the repo. That version of this file was
> aspirational/fabricated, not documentation of the actual codebase, and has
> been replaced below with what is actually here. **The codebase is always
> the source of truth — if this file and the code ever disagree again,
> trust the code and fix this file.**

---

## 1. Actual Tech Stack

- **Frontend:** React 18 + TypeScript (strict) + Vite. Routing via
  `react-router-dom` v7. i18n via `react-i18next` (namespaces per feature,
  see `src/locales/{en,ar}/*.json`).
- **Styling:** Plain CSS with CSS custom properties as design tokens
  (`src/index.css`, `:root` block). **No Tailwind, no CSS-in-JS library.**
  Components mix the global stylesheet's utility classes (`.btn`, `.glass`,
  `.field`, `.admin-*`) with per-component inline `style={{ ... }}` objects
  for one-off layout. This is the real, current pattern — not an anti-pattern
  to "fix" by introducing a new styling system.
- **Animation:** GSAP (+ ScrollTrigger) is the only animation library. There
  is no Framer Motion, no `motion`, no `vaul`. Keep it that way unless there
  is a genuinely strong reason to add something new — ask first.
- **Icons:** `lucide-react` for admin/portal UI; a small hand-rolled SVG set
  in `src/utils/icons.tsx` for the public marketing site.
- **Backend:** Node/Express 5 + Prisma ORM + PostgreSQL (Neon), JWT access +
  refresh-token sessions via HttpOnly cookies. See `src/server/`.
- **Env-driven auth:** Google Sign-In is fully implemented but only renders
  if `VITE_GOOGLE_CLIENT_ID` (frontend) / `GOOGLE_CLIENT_ID` (backend) are
  set. Absence of the button is expected/correct behavior, not a bug.

## 2. Existing Design System (reuse, don't duplicate)

These already exist and should be reused rather than re-implemented:

- **Buttons:** `.btn` + modifier classes `.btn-primary`, `.btn-outline`,
  `.btn-secondary`, `.btn-ghost`, `.btn-danger`, sizes `.btn-sm`/`.btn-xs`,
  `.btn-icon`, loading state `.btn-loading`. Always compose these classes
  instead of hand-rolling inline background/color/padding for a button.
- **Status colors:** semantic CSS variables `--success`, `--success-bg`,
  `--success-border` (and the `--danger-*`, `--warning-*`, `--info-*`
  equivalents) live in `src/index.css` `:root`. **Never hardcode hex like
  `#f87171`/`#86efac`/`#4ade80` again** — reference the variable.
- **Inline feedback banners:** `src/components/admin/Alert.tsx`
  (`<Alert tone="error|success|warning|info">...</Alert>`, optional
  `center` prop). This replaced ~28 separately hand-written inline
  `<div style={{...}}>` error/success blocks that were duplicated
  page-to-page — always use this instead of a new inline banner.
- **Status badges:** `src/components/admin/StatusPill.tsx` (`tone`:
  success/warning/danger/info/neutral).
- **Toasts:** `src/components/admin/ToastProvider.tsx` /
  `useToast()`. One toast system exists — don't add a second.
- **List-page scaffolding:** `PageHeader`, `TableSkeleton`, `EmptyState`,
  `DeleteConfirmModal` in `src/components/admin/` — the standard shape for
  every Admin*List page (search/filter toolbar → `.admin-table` → skeleton
  while loading → empty state → pagination).
- **Forms:** `PasswordInput` (`src/components/PasswordInput.tsx`) is the one
  password field with a visibility toggle; reuse it, don't recreate it.
- **Auth shell:** `AdminLogin.tsx` is a centered glass sign-in card (not a
  split-screen layout) with an animated conic-gradient border, GSAP entrance
  choreography, and a subtle desktop-only 3D tilt — this is the current,
  intentional design; don't silently revert it.
- **Admin chrome:** `ProtectedRoute.tsx` owns the entire authenticated shell
  (sidebar, topbar, background layers `#bgImageLayer`/`.bg-overlay-veil`/
  `.bg-grid`/`.orb-*`/`.noise`, notifications dropdown, search). Don't
  reimplement shell chrome inside individual pages.

## 3. Brand Identity — Do Not Replace

- Colors: `--primary` `#A855F7`, `--secondary` `#7C3AED`, `--accent`
  `#C084FC`, `--glow` `#D8B4FE`, dark background `--bg` `#05010A`.
- Logo: `public/logo.svg`. Splash/background image: `public/hero-bg.jpg`.
- Fonts: `IBM Plex Sans Arabic` (`--ff-ar`) for Arabic, `Inter` (`--ff-en`)
  for English/numerals.

Improve presentation (spacing, contrast, hierarchy, consistency) freely.
Do not swap the palette, logo, or background imagery for something new
without an explicit request to do so.

## 4. Core Engineering Constraints (unchanged from prior guidance)

- Never auto-commit, push, or deploy — deliver changes as files/diffs for
  manual review and merge.
- Never silently mask real errors or turn failures into false successes
  (see the deliberately-reverted `Promise.allSettled` case in
  `public.service.ts`'s `getHome()` for why).
- Never invent data, change business logic, or add dependencies without
  justification.
- Always validate with `npx tsc --noEmit -p tsconfig.json` (frontend) and
  `npm run build:web` before declaring frontend work complete. Backend
  changes should also pass `npx tsc --noEmit -p tsconfig.server.json`, but
  `npm run build:server` needs `prisma generate`, which needs network
  access to Prisma's binary CDN — this is unavailable in the sandbox, so
  that specific step must be run locally by Youssef.
- Prefer surgical, targeted edits over full rewrites for complex or
  sensitive files. This applies doubly to UI/UX passes: identify concrete,
  reusable-component-shaped duplication first, fix that, and leave working
  layout/logic alone otherwise.
- The site is RTL-first (Arabic default). Use logical CSS properties
  (`inset-inline-start/end`, `padding-inline-*`, `margin-inline-*`,
  `text-align: start/end`) for anything direction-sensitive — never
  hardcoded `left`/`right`.
- RBAC: Admin/Client roles, permission-gated via `PermissionGuard` and
  `requirePermission` middleware. Don't touch this from a UI task.

## 5. Known Gaps / Backlog (accurate as of this review)

- Loading-state consistency: most Admin*List pages use `TableSkeleton`, but
  several detail/form pages (`AdminHero`, `AdminClientForm`, etc.) still
  show a plain centered "Loading..." text div instead of a skeleton. Not
  urgent, but worth an eventual pass for visual consistency.
- `render.yaml` still doesn't exist for Render's Persistent Disk config —
  see `DEPLOYMENT.md` §7. Unrelated to frontend work; flagged here only so
  it isn't lost.
