# Codebase Evaluation

## Overview
- **Project purpose:** Offline-first progressive web app that bundles a lecture hub, pediatrics congenital heart disease (CHD) question bank, chest X-ray labeling game, and EKG reader into a single tabbed interface. 【F:README.md†L1-L3】【F:index.html†L13-L37】
- **Technology stack:** Vanilla HTML/CSS/JavaScript with hash-based routing and a service worker for offline caching. No external build tooling is required; assets are served statically. 【F:index.html†L13-L37】【F:js/router.js†L1-L24】【F:sw.js†L1-L72】
- **Deployment target:** Configured for static hosting (e.g., Vercel) with custom headers and SPA rewrites. 【F:vercel.json†L1-L33】

## Application architecture
- **Entry point:** `index.html` bootstraps the layout, registers the service worker, and pulls in the JavaScript bundle via ES modules. 【F:index.html†L13-L38】【F:js/app.js†L20-L59】
- **Routing:** `js/router.js` implements a hash-based router that maps `#/` fragments to view factories under `js/pages/`. Navigation updates the selected tab for accessibility. 【F:js/router.js†L8-L24】
- **View rendering:** `js/utils.js` exposes helper utilities, notably `setView`, which injects new HTML into `<main>` and re-executes any inline scripts contained in the page templates so that feature-specific modules initialize after navigation. 【F:js/utils.js†L1-L35】
- **State persistence:** `js/utils.js` also wraps `localStorage` access, while feature modules (lecture, qbank) persist user configuration and progress via these helpers or direct `localStorage` operations. 【F:js/utils.js†L27-L29】【F:js/pages/lecture.js†L8-L38】【F:js/pages/qbank.js†L26-L84】

## Feature modules
- **Home:** Provides status summaries, deep links to feature tabs, and an install button that uses the `beforeinstallprompt` event gating in `app.js`. 【F:js/pages/home.js†L3-L34】【F:js/app.js†L4-L59】
- **Lecture hub:** Stores an arbitrary embed snippet and previews it, with local video playback support via an inline module script. 【F:js/pages/lecture.js†L3-L38】
- **Question bank:** Loads question data from `data/qbank.json`, tracks progress, persists answers, and exposes controls for navigation, shuffle, and reset. Rendering happens inside an inline module script. 【F:js/pages/qbank.js†L5-L88】【F:data/qbank.json†L1-L120】
- **CXR labeling game:** Fetches configuration from `data/cxr_tasks.json`, draws on a `<canvas>`, and scores the user's clicks against defined target radii. 【F:js/pages/cxr.js†L3-L103】【F:data/cxr_tasks.json†L1-L33】
- **EKG reader:** Draws an ECG strip grid, plots samples from uploaded or sample CSVs, and provides calipers for heart-rate estimation. 【F:js/pages/ekg.js†L3-L111】【F:data/ekg_sample.csv†L1-L120】

## Offline & install experience
- **Service worker:** Pre-caches all core assets, serves navigation requests with a network-first fallback to cached `index.html` or `offline.html`, and performs stale-while-revalidate caching for same-origin requests. Cache busting is manual via versioned cache names. 【F:sw.js†L1-L72】
- **PWA metadata:** Manifest defines icons, theme colors, and standalone display mode. Apple touch icons and meta tags are present for iOS installability. 【F:manifest.webmanifest†L1-L21】【F:index.html†L4-L33】
- **Add-to-home-screen flow:** `app.js` captures the install prompt, exposes a global trigger, and mirrors readiness state to the home tab button. 【F:js/app.js†L4-L59】【F:js/pages/home.js†L3-L34】

## Data & assets
- **Content files:** Question bank, CXR task definitions, and an EKG CSV sample live under `data/` for easy customization, and are pre-cached by the service worker. 【F:data/qbank.json†L1-L120】【F:data/cxr_tasks.json†L1-L33】【F:sw.js†L3-L23】
- **Static assets:** Icons and sample imagery live under `assets/` and are referenced in both the manifest and service worker precache list. 【F:sw.js†L3-L23】【F:index.html†L10-L27】
- **Single source of truth:** The live app and deployable assets now live exclusively in the repository root; release bundles are produced on demand per the README workflow. 【F:README.md†L1-L33】【F:README.md†L35-L56】

## Deployment & configuration
- **Hosting:** `vercel.json` enforces long-lived immutable caching for static assets, short caching for data files, a `Service-Worker-Allowed` header, and SPA rewrites to `index.html`. 【F:vercel.json†L1-L33】
- **Offline fallback:** `offline.html` offers a simple offline notification page and is cached by the service worker for navigation fallback. 【F:offline.html†L1-L20】【F:sw.js†L3-L55】

## Quality observations
- **Strengths:**
  - Clear modular separation of features with minimal dependencies, easing customization for domain experts. 【F:js/router.js†L1-L24】【F:js/pages/home.js†L3-L34】【F:js/pages/qbank.js†L5-L88】
  - Thoughtful offline strategy with explicit precache list and runtime caching for same-origin fetches, aligning with an offline-first goal. 【F:sw.js†L1-L72】
  - Accessibility considerations such as ARIA roles on the tabbed navigation and live region updates for the main content. 【F:index.html†L22-L32】
- **Opportunities:**
  - Centralized utilities reduce repetition but `setView` appends cloned `<script>` tags to `<head>` without cleanup, so long-running sessions can accumulate duplicate scripts. Consider executing scripts in-place or removing injected nodes after execution. 【F:js/utils.js†L11-L24】
  - Cache versioning is manual; adopting a build step or hash-based naming would avoid stale caches after incremental updates. 【F:sw.js†L1-L28】

## Risks & issues
| Severity | Area | Description |
| --- | --- | --- |
| High | Question bank persistence | `userAnswers` is keyed by the visual index (`idx`) instead of the question identifier, so shuffling reorders questions but leaves stored answers tied to previous positions, corrupting progress tracking. Map answers to `state.order[idx]` instead. 【F:js/pages/qbank.js†L44-L83】 |
| Medium | Script lifecycle | `setView` re-injects inline scripts into `<head>` on every navigation but never removes them, which can leak event listeners and duplicate initialization logic after repeated tab switches. Cleanup the injected script elements once executed or run scripts in an isolated scope. 【F:js/utils.js†L11-L24】 |
| Low | Legacy helper | The top-level `shuffle` helper is defined but unused, indicating either dead code or incomplete adoption. Remove it or use it to prevent drift. 【F:js/pages/qbank.js†L3-L4】 |
| Low | Data hygiene | Several JSON/HTML files lack trailing newlines, which can cause lint failures in stricter pipelines. Normalizing formatting would improve tooling compatibility. 【F:data/cxr_tasks.json†L1-L33】【F:offline.html†L1-L20】 |

## Recommendations
1. **Fix question bank persistence:** Key `userAnswers` by question id (e.g., `state.order[idx]`) and reset correctly when shuffling to ensure answer history survives reordering. 【F:js/pages/qbank.js†L44-L83】
2. **Manage inline scripts safely:** Update `setView` to execute inline modules without permanently appending duplicate script nodes, perhaps by using `import()` for module scripts or removing appended nodes after load. 【F:js/utils.js†L11-L24】
3. **Automate cache busting:** Introduce a simple build step (e.g., npm script) to update the `CACHE_NAME` or use hashed asset names to guarantee fresh deployments. 【F:sw.js†L1-L28】
4. **Add linting/tests:** Even lightweight linting (ESLint, Prettier) and smoke tests (Playwright/Puppeteer) would catch regressions in inline scripts and ensure offline flows remain intact. 【F:js/pages/qbank.js†L5-L88】【F:sw.js†L1-L72】
