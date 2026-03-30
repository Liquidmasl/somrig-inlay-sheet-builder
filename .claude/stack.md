# Stack Deep-Dive

## Tailwind CSS v4

**No config file** — Tailwind v4 is configured entirely through CSS and the Vite plugin.

- Plugin: `@tailwindcss/vite` (import in `vite.config.ts`)
- Entry: `src/style.css` starts with `@import "tailwindcss";`
- Custom dark variant: `@custom-variant dark (&:where(.dark, .dark *));`
  - This means Tailwind dark: utilities activate when `.dark` is on any ancestor element
  - The `useDarkMode` composable toggles `.dark` on `document.documentElement`
- **No `tailwind.config.js` or `tailwind.config.ts`** — do not create one unless explicitly required. Use CSS-based config (`@theme`, `@plugin`) if customization is needed.

## MDI Icons (@mdi/js)

- Import named path constants: `import { mdiIconName } from '@mdi/js'`
- Render pattern:
  ```vue
  <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
    <path :d="mdiIconName" />
  </svg>
  ```
- No icon component library needed — just raw SVG paths.
- Full icon list: https://pictogrammers.com/library/mdi/

## Vite 8 (Rolldown-based)

- Uses Rolldown bundler under the hood (replaces Rollup)
- Node bindings present: `@rolldown/binding-linux-x64-gnu`, `@rolldown/binding-linux-x64-musl`
- API is backward-compatible with Vite 5/6 config format
- TypeScript config split: `tsconfig.app.json` (src files) + `tsconfig.node.json` (vite config)

## TypeScript

- Project references pattern (`tsconfig.json` references app + node configs)
- Build type-checks via `vue-tsc -b` before Vite build
- `@vue/tsconfig` base configs used

## Vercel Deployment

- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, `framework: vite`
- SPA routing: if routes are added later, a `rewrites` rule to `/index.html` will be needed
