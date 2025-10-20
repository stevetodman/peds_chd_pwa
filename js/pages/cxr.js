import { html } from '../utils.js';

export default function cxr() {
  return html`
  <div class="grid two">
    <div class="card">
      <h2>CXR Labeling Game</h2>
      <p class="help">Click the requested anatomical target. If your click lands within the green radius, you score a point.</p>
      <div style="display:flex; gap:.5rem; flex-wrap: wrap; margin-top:.5rem;">
        <button class="btn" id="startBtn">Start</button>
        <button class="btn" id="nextBtn" disabled>Next Target</button>
        <button class="btn" id="resetBtn">Reset</button>
      </div>
      <p class="small" id="score">Score: 0 / 0</p>
      <p class="small" id="hint"></p>
      <p class="small">Image: <span id="imgName"></span></p>
    </div>
    <div class="card">
      <canvas id="cxr" width="512" height="512" aria-label="CXR canvas"></canvas>
    </div>
  </div>

  <script type="module">
    const canvas = document.getElementById('cxr');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const scoreEl = document.getElementById('score');
    const hintEl = document.getElementById('hint');
    const imgNameEl = document.getElementById('imgName');

    startBtn.disabled = true;
    let data = null;
    let img = new Image();
    let order = [];
    let idx = -1;
    let score = 0; let attempted = 0;
    let clickEnabled = false;

    function drawBase() {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      if (img.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    function ring(x,y,r,color='#00ff00') {
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
    }

    async function loadData() {
      try {
        const dataUrl = new URL('data/cxr_tasks.json', window.location.href);
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error('Failed to load CXR targets');
        const payload = await res.json();
        if (!payload || !Array.isArray(payload.targets)) {
          throw new Error('Invalid CXR dataset');
        }
        data = payload;
        img.src = data.image;
        img.onload = () => { drawBase(); };
        imgNameEl.textContent = data.image;
      } catch (err) {
        console.error(err);
        hintEl.textContent = 'Unable to load dataset. Please check your connection.';
        imgNameEl.textContent = 'Unavailable';
        nextBtn.disabled = true;
      } finally {
        startBtn.disabled = !data;
      }
    }

    function next() {
      idx += 1;
      hintEl.textContent = '';
      if (idx >= order.length) {
        alert('Round complete! Score: '+score+' / '+attempted);
        clickEnabled = false;
        nextBtn.disabled = true;
        return;
      }
      const t = data.targets[order[idx]];
      drawBase();
      ring(t.cx, t.cy, t.r);
      hintEl.textContent = 'Target: ' + t.name + (t.hint ? ' — ' + t.hint : '');
      clickEnabled = true;
      nextBtn.disabled = false;
    }

    canvas.addEventListener('click', (e) => {
      if (!clickEnabled) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const t = data.targets[order[idx]];
      const dist = Math.hypot(x - t.cx, y - t.cy);
      attempted += 1;
      if (dist <= t.r) { score += 1; ring(x,y,10,'#00ff00'); }
      else { ring(x,y,10,'#ff0040'); }
      scoreEl.textContent = 'Score: ' + score + ' / ' + attempted;
      clickEnabled = false;
      nextBtn.disabled = false;
    });

    startBtn.addEventListener('click', () => {
      if (!data || !Array.isArray(data.targets) || data.targets.length === 0) {
        alert('The dataset is still loading. Please try again shortly.');
        return;
      }
      score = 0; attempted = 0; idx = -1;
      order = Array.from(data.targets.keys()).sort(()=>Math.random()-0.5);
      scoreEl.textContent = 'Score: 0 / 0';
      nextBtn.disabled = true;
      next();
    });
    nextBtn.addEventListener('click', () => next());
    document.getElementById('resetBtn').addEventListener('click', () => {
      score = 0; attempted = 0; idx = -1; drawBase();
      scoreEl.textContent = 'Score: 0 / 0';
      hintEl.textContent = '';
    });

    loadData();
  </script>
  `;
}
