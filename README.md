# Peds CHD PWA (offline-first, Vercel-ready)

A single-page progressive web app that bundles lecture resources, a pediatrics CHD question bank, a chest X-ray labeling game, and an EKG reader. The repository root is the only source of truth—no duplicate `peds_chd_pwa_final/` tree is kept in version control.

## Project layout
- `index.html` – Shell document that renders the tabbed UI, registers the service worker, and loads feature modules.
- `js/` – ES module bundle for routing, feature pages, and shared utilities.
- `data/` – JSON/CSV content consumed by the question bank, CXR game, and EKG viewer.
- `assets/` – Icons and static imagery referenced by the manifest and views.
- `sw.js` & `manifest.webmanifest` – Offline caching strategy and PWA metadata.
- `vercel.json` – Static hosting configuration (headers and SPA rewrite rules).

## Local development
No build tooling is required. Open `index.html` directly in a browser or serve the root directory over HTTP to exercise service-worker behaviour:

```bash
python3 -m http.server 8000
# visit http://localhost:8000 to load the app
```

## Deployment
The repo is ready for static hosting services such as Vercel:

1. Create a new Vercel project using the root of this repository.
2. Choose the **Other** framework preset with **no build command**.
3. Leave the output/public directory blank so Vercel serves the repository root.
4. Deploy—`vercel.json` applies the required caching headers and SPA rewrites.

For other static hosts, upload the repository contents as-is or sync them to your target bucket/server.

## Producing release artifacts
If you need a standalone bundle (previously kept under `peds_chd_pwa_final/`), create it from the root sources on demand. For example, to make a distributable ZIP archive:

```bash
mkdir -p dist
rsync -a --delete \
  --exclude '.git' \
  --exclude 'dist' \
  ./ dist/peds_chd_pwa
cd dist
zip -r peds_chd_pwa_static.zip peds_chd_pwa
```

The resulting `dist/peds_chd_pwa_static.zip` file replicates the deployable static site without introducing a second maintained copy in the repository.
