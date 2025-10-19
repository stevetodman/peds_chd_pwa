import { html, load } from '../utils.js';

export default function lecture() {
  const saved = load('lecture_embed', '');
  return html`
  <div class="grid two">
    <div class="card">
      <h2>Slides (Embed)</h2>
      <label for="embed">Paste an iframe or embed snippet</label>
      <textarea id="embed" rows="6" placeholder="<iframe src='...'></iframe>">${saved || ''}</textarea>
      <div style="display:flex; gap:.5rem; margin-top:.5rem;">
        <button class="btn primary" onclick="(function(){ const v=document.getElementById('embed').value; localStorage.setItem('lecture_embed', JSON.stringify(v)); (document.getElementById('embedView').innerHTML = v); })()">Save &amp; Show</button>
        <button class="btn" onclick="(function(){ localStorage.removeItem('lecture_embed'); document.getElementById('embed').value=''; document.getElementById('embedView').innerHTML=''; })()">Clear</button>
      </div>
      <p class="help">Use OneDrive/Google Slides embed code. The embed is stored locally and will render when offline if the provider supports it.</p>
    </div>
    <div class="card">
      <h2>Local Video (Offline)</h2>
      <input id="vidFile" type="file" accept="video/*" />
      <video id="player" controls style="width:100%; max-height:60vh; margin-top:.5rem;"></video>
      <p class="help">Select a local file; it will play offline while this app remains open. For persistent offline playback, host the video file in <span class="kbd">assets/</span> and add it to the service worker's precache list.</p>
    </div>
  </div>
  <div class="card">
    <h2>Preview</h2>
    <div id="embedView">${saved || ''}</div>
  </div>
  <script type="module">
    const input = document.getElementById('vidFile');
    const player = document.getElementById('player');
    input?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      player.src = url;
      player.play();
    });
  </script>`;
}
