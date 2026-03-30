# CLAUDE.md — somrig-inlay-sheet-builder

## Cost Reduction Strategy

Every session should read this file first (~150 lines), then load only the `.claude/*.md` deep-dives it actually needs. Deep-dive files are **not auto-loaded** — they exist to keep this root file small. A fact recorded here prevents re-discovery via trial-and-error tool calls.

When you learn something non-obvious about this project that future sessions would benefit from, add it here or to a `.claude/<topic>.md` file (and index it below).

---

## Project Overview

**Somrig Inlay Sheet Builder** — a browser-based tool for building inlay sheets (likely for woodworking/crafts). Currently in early scaffold phase.

- **Repo:** `somrig-inlay-sheet-builder`
- **Linear project:** LQM (issue prefix `LQM-`)
- **Deployment:** Vercel (`vercel.json` present, `outputDirectory: dist`, `buildCommand: npm run build`)
- **Branch convention:** `<author>/<issue-id>-<slug>`, e.g. `cyrus/lqm-68-project-setup-vite-vue-3-tailwind-mdi`
- **PR convention:** title must include Linear issue identifier, e.g. `LQM-68 Project setup: Vite + Vue 3 + Tailwind + MDI`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite 8 (Rolldown-based) |
| Framework | Vue 3.5 (Composition API, `<script setup>`) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed) |
| Icons | `@mdi/js` (Material Design Icons, path-based SVG) |
| Language | TypeScript 5.9 (strict, project references) |
| Deploy | Vercel |

See `.claude/stack.md` for setup details and gotchas.

---

## Project Structure

```
src/
  main.ts               # App entry point
  App.vue               # Root component (dark mode init, layout shell)
  style.css             # Global styles — @import "tailwindcss" + dark variant
  components/
    AppHeader.vue       # Header with dark mode toggle button
  composables/
    useDarkMode.ts      # Dark mode state (localStorage + prefers-color-scheme)
  assets/               # Static assets (hero.png, vite.svg, vue.svg)
public/
  favicon.svg
  icons.svg
dist/                   # Build output (gitignored? check .gitignore)
vercel.json             # Vercel deployment config
vite.config.ts          # Vite config (vue + tailwindcss plugins)
tsconfig.json           # TS project references root
tsconfig.app.json       # App TS config
tsconfig.node.json      # Node/vite TS config
```

---

## Key Conventions

- **Dark mode:** class-based (`.dark` on `<html>`), toggled via `useDarkMode` composable. Stored in `localStorage` under key `color-scheme`. Dark variant defined as `@custom-variant dark (&:where(.dark, .dark *))` in `style.css`.
- **Icons:** Import SVG path strings from `@mdi/js` (e.g. `import { mdiWeatherNight } from '@mdi/js'`), render as `<svg viewBox="0 0 24 24"><path :d="iconPath" /></svg>`.
- **No router yet** — single-page app, no Vue Router installed.
- **No state management yet** — no Pinia installed.

---

## Scripts

```bash
npm run dev      # Vite dev server
npm run build    # Type-check (vue-tsc) then Vite build → dist/
npm run preview  # Preview production build
```

---

## Deep-Dive Index

| File | Topic |
|------|-------|
| `.claude/stack.md` | Tailwind v4 setup details, MDI usage patterns, Vite 8 notes |
