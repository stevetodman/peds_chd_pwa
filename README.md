# Peds CHD PWA (offline-first, Vercel-ready)

An installable progressive web app for congenital heart disease teaching. The bundle ships as static assets that you can host on Vercel (default), GitHub Pages, or any static server.

## Quick start

1. Clone this repository.
2. Serve the app locally from the project root with any static server. For example:
   ```bash
   npx serve .
   ```
   This starts a server on <http://localhost:3000> (by default) and enables the service worker.
3. Build/deploy by pushing to your hosting provider (no additional build step required).

## Features

- Offline-first shell powered by `sw.js` with navigation fallback to `offline.html`.
- Hash routing with accessible tab navigation between Home, Lecture, QBank, CXR game, and EKG reader.
- Local caching for question bank data and SVG-based practice activities.
- Lecture module supports sandboxed embeds and local video playback.
- Responsive layout with small CSS footprint and no external CDN dependencies.

## Customizing content

| Area | Files to edit |
| ---- | ------------- |
| Home copy | `js/pages/home.js` |
| Lecture embed default | Save your iframe snippet in the UI; it is sanitized and stored in `localStorage`. |
| QBank questions | `data/qbank.json` (update `version` field to invalidate saved progress). |
| CXR targets | `data/cxr_tasks.json` and associated assets under `assets/cxr/`. |
| EKG sample data | Replace `data/ekg_sample.csv` with your CSV (time,value). |
| Styling | `styles.css` |

After changing static assets or data files, update the `ASSETS` list in `sw.js` if you need them precached for offline use.

## Deployment notes

- `vercel.json` configures security headers and cache lifetimes. JavaScript files are set to `must-revalidate` to ensure new service worker deployments fetch fresh code, while images and CSS remain long-lived.
- The service worker version (`CACHE_NAME` in `sw.js`) should be bumped whenever you change precached assets.
- Add additional host-specific headers (e.g., Content Security Policy) at the edge if you serve from another provider.

## Security and privacy considerations

- Lecture embeds are sandboxed inside an iframe and sanitized to strip `<script>` tags and inline event handlers before storage.
- The app only stores UI state (question progress, lecture embed) locally and does not transmit protected health information.
- Review and extend `vercel.json` if you need a stricter Content Security Policy or additional compliance headers.

## License

Released under the [MIT License](./LICENSE).
