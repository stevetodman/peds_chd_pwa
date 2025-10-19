import { html } from '../utils.js';

export default function ekg() {
  return html`
  <div class="grid two">
    <div class="card">
      <h2>EKG Reader</h2>
      <p class="help">Load a CSV with <span class="kbd">time_s, lead_I_mV</span>. Use click‑drag to place calipers; heart rate is estimated from the interval.</p>
      <div style="display:flex; gap:.5rem; flex-wrap: wrap; margin-top:.5rem;">
        <input id="file" type="file" accept=".csv" />
        <button class="btn" id="loadSample">Load sample</button>
        <label>Sampling rate (Hz) <input id="fs" type="number" step="1" min="50" value="200" style="width:8ch;"></label>
      </div>
      <p class="small">Calipers: drag across an RR interval. <span id="calipers"></span></p>
    </div>
    <div class="card">
      <canvas id="strip" width="1000" height="320"></canvas>
    </div>
  </div>
  <script type="module">
    const canvas = document.getElementById('strip');
    const ctx = canvas.getContext('2d');
    const file = document.getElementById('file');
    const fsEl = document.getElementById('fs');
    const calipersEl = document.getElementById('calipers');

    let data = [];
    let dragging = false;
    let startX = null, endX = null;

    function drawGrid() {
      ctx.fillStyle = '#111'; ctx.fillRect(0,0,canvas.width,canvas.height);
      const fs = Number(fsEl.value||200);
      const pxPerSec = 200;
      const pxPerSmall = pxPerSec * 0.04;
      const pxPerBig = pxPerSmall * 5;
      const mvToPx = 50;

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      for (let x=0; x<canvas.width; x+=pxPerSmall) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y=0; y<canvas.height; y+=mvToPx/5) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      for (let x=0; x<canvas.width; x+=pxPerBig) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y=0; y<canvas.height; y+=mvToPx) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

      if (data.length) {
        ctx.beginPath();
        ctx.strokeStyle = '#00e676'; ctx.lineWidth=1.8;
        const mid = canvas.height/2;
        for (let i=0; i<data.length; i++) {
          const x = Math.floor(data[i].t * pxPerSec);
          const y = Math.floor(mid - data[i].v * mvToPx);
          if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          if (x > canvas.width) break;
        }
        ctx.stroke();
      }

      if (startX != null) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, canvas.height); ctx.stroke(); }
      if (endX != null)   { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(endX, 0); ctx.lineTo(endX, canvas.height); ctx.stroke(); }
      if (startX != null && endX != null) {
        const dx = Math.abs(endX - startX);
        const sec = dx / 200;
        const hr = 60 / sec;
        calipersEl.textContent = `Δt = ${sec.toFixed(2)} s → HR ≈ ${hr.toFixed(0)} bpm`;
      } else {
        calipersEl.textContent = '';
      }
    }

    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      const out = [];
      for (let i=1; i<lines.length; i++) {
        const [t, v] = lines[i].split(',');
        out.push({ t: parseFloat(t), v: parseFloat(v) });
      }
      return out;
    }

    file.addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const text = await f.text();
      data = parseCSV(text);
      drawGrid();
    });

    document.getElementById('loadSample').addEventListener('click', async () => {
      const res = await fetch('data/ekg_sample.csv');
      const text = await res.text();
      data = parseCSV(text);
      drawGrid();
    });

    canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      const rect = canvas.getBoundingClientRect();
      startX = endX = Math.floor((e.clientX - rect.left));
      drawGrid();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      endX = Math.floor((e.clientX - rect.left));
      drawGrid();
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    drawGrid();
  </script>
  `;
}
