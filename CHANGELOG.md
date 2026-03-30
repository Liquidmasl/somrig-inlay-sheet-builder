# Changelog

## [0.0.2] - 2026-03-30

- Fix Netlify deployment in automated release workflow by using the `prod` GitHub environment for secrets


## [0.0.1] - 2026-03-30



## [Unreleased]

### Added
- **Dark mode, responsive layout, and footer** — Dark mode now applies instantly on load with no flash (theme is read from `localStorage` / `prefers-color-scheme` before Vue renders). Button inlay SVG previews always use a white background and black ink regardless of theme, matching print output. The layout is now responsive: on mobile the sheet canvas appears on top with the editor panel below; on desktop the side-by-side panel layout is preserved. A small footer crediting Aasikki's original template has been added. ([LQM-74](https://linear.app/liquidmasl/issue/LQM-74/dark-mode-polish), [#15](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/15))

### Changed
- **UI layout and usability** — Button inlays are now displayed at a smaller scale so the entire canvas and editor panel are visible without zooming out. The redundant SVG preview in the editor panel has been removed; edits are reflected directly on the selected button in the canvas. Zone type selectors (single/hold/double) are now shown per zone, allowing any combination — e.g. a button with two "double" zones is now possible. ([LQM-80](https://linear.app/liquidmasl/issue/LQM-80/ui-pass), [#11](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/11))

### Added
- **Full MDI icon search in icon picker** — The icon picker now searches all 7,447 Material Design Icons with a debounced search input (300 ms). Icons are lazy-loaded into a virtualized grid so the picker is snappy regardless of result count. The currently-selected icon is highlighted with a blue ring. ([LQM-71](https://linear.app/liquidmasl/issue/LQM-71/icon-picker-with-mdi-search), [#14](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/14))
- **PayPal donation button** — A heart-shaped "Support" button in the header opens a modal with custom copy ("No ads. No tracking. Just vibes.") and a branded PayPal donate button. Replaces the default PayPal GIF with a clean, sympathetic design. ([LQM-78](https://linear.app/liquidmasl/issue/LQM-78/add-paypal-donation-button), [#13](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/13))
- **Print and Download PDF** — Print or save the active button inlay sheet as a PDF via Print/Download PDF buttons in the header. The print stylesheet hides all UI chrome and renders each button inlay at its exact physical size (41.2×71.9mm) for accurate cutting. Works in Chrome and Firefox. ([LQM-75](https://linear.app/liquidmasl/issue/LQM-75/print-and-download-functionality), [#12](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/12))
- **Button editor panel** — Side panel for configuring a selected button inlay. Click any button in the canvas to select it; the editor shows a live SVG preview, zone count segmented controls (1/2/3) for each physical half, per-zone icon picker (44 MDI icons with search), icon size slider (6–20mm), and icon color picker. Zone counts auto-assign action types (1→single, 2→single+hold, 3→single+double+hold). All changes reflect in real time in both the editor preview and the canvas. ([LQM-72](https://linear.app/liquidmasl/issue/LQM-72/button-editor-panel-zone-config-icon-size-color), [#6](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/6))
- **Button inlay data model** — TypeScript types (`ActionType`, `ActionZone`, `PhysicalButton`, `ButtonInlay`, `Sheet`) and a reactive `useSheets` composable with add/remove support for sheets and buttons. Default state is one sheet with one empty button inlay. ([LQM-69](https://linear.app/liquidmasl/issue/LQM-69/data-model-button-inlay-sheet-types), [#5](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/5))
- **Playwright e2e test suite** — Automated tests for app load, dark mode toggle, ButtonInlaySVG zone variants, mixed top/bottom zone combinations, and indicator labels. Screenshot workflow captures full-page and per-section PNGs for PR documentation via `npm run screenshot`. ([LQM-77](https://linear.app/liquidmasl/issue/LQM-77/create-playwright-test-scripts-for-automated-testing-and), [#4](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/4))
- **Independent top/bottom zone control** — `ButtonInlaySVG` now supports separate zone counts (1, 2, or 3) and separate icon/indicator config for the top and bottom halves of each button via `topZones`/`botZones` and `topZoneConfig`/`botZoneConfig` props. Each zone on each side has its own icon and function indicator (dot = single press, dash = long press, double-dot = double press), and each function kind appears at most once per side. ([LQM-77](https://linear.app/liquidmasl/issue/LQM-77/create-playwright-test-scripts-for-automated-testing-and), [#4](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/4))
- **ButtonInlaySVG component** — Renders a single Somrig button inlay as a print-accurate SVG using exact dimensions extracted from the Aasikki PDF template (41.2×71.9mm). Supports 1, 2, and 3 zone layouts with MDI icon paths, dot/double-dot/dash action indicators, and a scale prop for screen preview vs print output. ([LQM-70](https://linear.app/liquidmasl/issue/LQM-70/svg-button-inlay-renderer), [#3](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/3))
