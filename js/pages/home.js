import { html, load } from '../utils.js';

export default function home() {
  const a2hs = !!load('a2hs_ready', false);
  return html`
  <section class="grid two">
    <div class="card">
      <h2>Welcome</h2>
      <p>This installable web app bundles your lecture hub, question bank, chest X‑ray labeling game, and EKG reader. It is fully offline after the first load.</p>
      <p><strong>Status:</strong> <span id="net">${navigator.onLine ? 'Online' : 'Offline'}</span></p>
      <div style="display:flex; gap:.5rem; flex-wrap: wrap; margin-top:.5rem;">
        <a class="btn" href="#/lecture">Open Lecture</a>
        <a class="btn" href="#/qbank">Open QBank</a>
        <a class="btn" href="#/cxr">Open CXR Game</a>
        <a class="btn" href="#/ekg">Open EKG Reader</a>
      </div>
    </div>
    <div class="card">
      <h2>Install</h2>
      <p>Add to your home screen for true offline mode.</p>
      <button id="installBtn" class="btn primary" ${a2hs ? '' : 'disabled'} onclick="window.__triggerInstall()">Install PWA</button>
      <p class="small">iPhone/iPad (Safari): Share → <span class="kbd">Add to Home Screen</span>. Android/desktop: use the install button above when available.</p>
    </div>
  </section>

  <section class="card">
    <h2>How to customize</h2>
    <ul>
      <li>QBank: edit <span class="kbd">data/qbank.json</span></li>
      <li>CXR tasks: edit <span class="kbd">data/cxr_tasks.json</span> and image in <span class="kbd">assets/cxr/</span></li>
      <li>EKG sample: replace <span class="kbd">data/ekg_sample.csv</span> or upload within the EKG page</li>
      <li>Lecture slides/video: paste an embed or select a local video in the Lecture page</li>
    </ul>
  </section>`;
}
