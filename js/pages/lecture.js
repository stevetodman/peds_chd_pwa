import { html, load, save } from '../utils.js';

function sanitizeEmbed(raw) {
  if (!raw) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return '';

  container.querySelectorAll('script').forEach(node => node.remove());
  container.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return container.innerHTML;
}

export default function lecture() {
  const rawSaved = load('lecture_embed', '');
  const saved = sanitizeEmbed(rawSaved);
  if (rawSaved && rawSaved !== saved) {
    if (saved) {
      save('lecture_embed', saved);
    } else {
      localStorage.removeItem('lecture_embed');
    }
  }

  return html`
  <div class="grid two">
    <div class="card">
      <h2>Slides (Embed)</h2>
      <label for="embed">Paste an iframe or embed snippet</label>
      <textarea id="embed" rows="6" placeholder="<iframe src='...'></iframe>">${saved}</textarea>
      <div class="actions">
        <button class="btn primary" id="saveEmbed">Save &amp; Show</button>
        <button class="btn" id="clearEmbed">Clear</button>
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
    <iframe id="embedFrame" title="Lecture embed preview" sandbox="allow-scripts allow-same-origin" style="width:100%; min-height:400px; border:1px solid #e5e7eb; border-radius:.5rem;"></iframe>
  </div>
  <script type="module">
    import { save } from '../utils.js';

    const textarea = document.getElementById('embed');
    const saveBtn = document.getElementById('saveEmbed');
    const clearBtn = document.getElementById('clearEmbed');
    const frame = document.getElementById('embedFrame');
    const input = document.getElementById('vidFile');
    const player = document.getElementById('player');

    const sanitizeEmbed = raw => {
      if (!raw) return '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
      const container = doc.body.firstElementChild;
      if (!container) return '';

      container.querySelectorAll('script').forEach(node => node.remove());
      container.querySelectorAll('*').forEach(node => {
        Array.from(node.attributes).forEach(attr => {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim().toLowerCase();
          if (name.startsWith('on') || value.startsWith('javascript:')) {
            node.removeAttribute(attr.name);
          }
        });
      });

      return container.innerHTML;
    };

    const renderEmbed = value => {
      const sanitized = sanitizeEmbed(value.trim());
      frame.srcdoc = sanitized || '<p class="help">Paste an embed snippet and click "Save &amp; Show".</p>';
      return sanitized;
    };

    saveBtn?.addEventListener('click', () => {
      const sanitized = renderEmbed(textarea.value);
      if (sanitized) {
        save('lecture_embed', sanitized);
        textarea.value = sanitized;
      } else {
        localStorage.removeItem('lecture_embed');
      }
    });

    clearBtn?.addEventListener('click', () => {
      textarea.value = '';
      frame.srcdoc = '<p class="help">Embed cleared.</p>';
      localStorage.removeItem('lecture_embed');
    });

    input?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      player.src = url;
      player.play();
    });

    const initial = ${JSON.stringify(saved)};
    textarea.value = initial;
    renderEmbed(initial);
  </script>`;
}
