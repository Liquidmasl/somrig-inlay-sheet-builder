# Changelog

## [Unreleased]

### Added
- **Playwright e2e test suite** — Automated tests for app load, dark mode toggle, ButtonInlaySVG zone variants (1/2/3 zones), and indicator labels. Screenshot workflow captures full-page and per-section PNGs for PR documentation via `npm run screenshot`. ([LQM-77](https://linear.app/liquidmasl/issue/LQM-77/create-playwright-test-scripts-for-automated-testing-and), [#4](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/4))
- **ButtonInlaySVG component** — Renders a single Somrig button inlay as a print-accurate SVG using exact dimensions extracted from the Aasikki PDF template (41.2×71.9mm). Supports 1, 2, and 3 zone layouts with MDI icon paths, dot/double-dot/dash action indicators, and a scale prop for screen preview vs print output. ([LQM-70](https://linear.app/liquidmasl/issue/LQM-70/svg-button-inlay-renderer), [#3](https://github.com/Liquidmasl/somrig-inlay-sheet-builder/pull/3))
