import { html, load, save } from '../utils.js';

export default function qbank() {
  const state = load('qbank_state', { idx: 0, correct: 0, answered: 0, order: [] });
  const order = state.order && state.order.length ? state.order : [];
  return html`
  <div class="card">
    <h2>Question Bank (offline)</h2>
    <div class="progress" aria-hidden="true"><div id="bar" style="width:${state.answered ? (100*state.answered/Math.max(state.total||1,1)) : 0}%"></div></div>
    <div id="qroot" class="qroot" style="margin-top:1rem;">Loading…</div>
    <div style="display:flex; gap:.5rem; margin-top:1rem; flex-wrap: wrap;">
      <button class="btn" id="prevBtn">Prev</button>
      <button class="btn" id="nextBtn">Next</button>
      <button class="btn" id="shuffleBtn">Shuffle</button>
      <button class="btn" id="resetBtn">Reset</button>
    </div>
    <p class="small" id="stats"></p>
  </div>
  <script type="module">
    const fmt = (n) => Number(n).toFixed(0);
    const root = document.getElementById('qroot');
    const stats = document.getElementById('stats');
    const bar = document.getElementById('bar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const resetBtn = document.getElementById('resetBtn');
    const state = JSON.parse(localStorage.getItem('qbank_state') || '{"idx":0,"correct":0,"answered":0,"order":[]}');
    let questions = [];
    let userAnswers = JSON.parse(localStorage.getItem('qbank_user_answers') || '{}');

    function sanitizeState(total) {
      const sanitized = [];
      const seen = new Set();
      if (Array.isArray(state.order)) {
        state.order.forEach((raw) => {
          const id = Number(raw);
          if (Number.isInteger(id) && id >= 0 && id < total && !seen.has(id)) {
            seen.add(id);
            sanitized.push(id);
          }
        });
      }
      for (let i = 0; i < total; i += 1) {
        if (!seen.has(i)) {
          seen.add(i);
          sanitized.push(i);
        }
      }
      const validIds = new Set(sanitized);
      Object.keys(userAnswers).forEach((key) => {
        const id = Number(key);
        if (!validIds.has(id)) delete userAnswers[key];
      });
      state.order = sanitized;
      if (!sanitized.length) {
        state.idx = 0;
      } else if (state.idx >= sanitized.length) {
        state.idx = sanitized.length - 1;
      } else if (state.idx < 0) {
        state.idx = 0;
      }
    }

    function recomputeProgress() {
      let correct = 0;
      let answered = 0;
      Object.entries(userAnswers).forEach(([key, choice]) => {
        const q = questions[Number(key)];
        if (!q || choice == null) return;
        answered += 1;
        if (choice === q.answer_index) correct += 1;
      });
      state.correct = correct;
      state.answered = answered;
      state.total = questions.length;
    }

    function saveState() { localStorage.setItem('qbank_state', JSON.stringify(state)); }
    function saveAnswers() { localStorage.setItem('qbank_user_answers', JSON.stringify(userAnswers)); }

    async function loadQuestions() {
      try {
        const res = await fetch('data/qbank.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch question bank (status ${res.status})`);
        const payload = await res.json();
        if (!Array.isArray(payload)) throw new Error('Question bank payload is not an array');
        questions = payload;
      } catch (err) {
        console.error('Unable to load question bank', err);
        const message = 'We\'re unable to load the question bank right now. Please check your connection and try again.';
        root.innerHTML = `<p class="alert" role="alert">${message}</p>`;
        stats.textContent = 'Correct 0 / 0 • 0 remaining';
        bar.style.width = '0%';
        state.order = [];
        state.idx = 0;
        state.correct = 0;
        state.answered = 0;
        state.total = 0;
        saveState();
        localStorage.removeItem('qbank_user_answers');
        [prevBtn, nextBtn, shuffleBtn, resetBtn].forEach(btn => { if (btn) btn.disabled = true; });
        return;
      }
      const total = questions.length;
      [prevBtn, nextBtn, shuffleBtn, resetBtn].forEach(btn => { if (btn) btn.disabled = false; });
      const prevOrder = Array.isArray(state.order) && state.order.length
        ? state.order.slice()
        : Array.from({ length: total }, (_, i) => i);
      const answerKeys = Object.keys(userAnswers);
      const isLegacy = answerKeys.length && answerKeys.every((key, idx) => Number(key) === idx);
      if (isLegacy) {
        const remapped = {};
        answerKeys.forEach((key) => {
          const qIdx = prevOrder[Number(key)];
          if (Number.isInteger(qIdx) && qIdx >= 0 && qIdx < total) remapped[qIdx] = userAnswers[key];
        });
        userAnswers = remapped;
        saveAnswers();
      }
      sanitizeState(total);
      recomputeProgress();
      saveState();
      saveAnswers();
      render();
    }

    function render() {
      if (!questions.length || !Array.isArray(state.order) || !state.order.length) {
        root.innerHTML = '<p>No questions available. Add entries to <span class="kbd">data/qbank.json</span>.</p>';
        stats.textContent = `Correct ${fmt(0)} / ${fmt(0)} • ${fmt(0)} remaining`;
        bar.style.width = '0%';
        return;
      }
      const idx = Math.min(Math.max(state.idx, 0), state.order.length-1);
      state.idx = idx;
      const qId = state.order[idx];
      const q = questions[qId];
      if (!q) {
        state.order.splice(idx, 1);
        sanitizeState(questions.length);
        recomputeProgress();
        saveState();
        saveAnswers();
        render();
        return;
      }
      const selected = userAnswers[qId];
      root.innerHTML = `
        <div><strong>Q${idx+1} of ${state.order.length}</strong></div>
        <p style="margin-top:.5rem;">${q.stem}</p>
        <div style="display:grid; gap:.5rem; margin-top: .5rem;">
          ${q.choices.map((c, i)=>{
            const isSel = selected === i;
            const correct = q.answer_index === i;
            const color = selected != null ? (correct ? 'background:#eaffea; border-color:#a7f3d0;' : (isSel ? 'background:#fff1f2; border-color:#fecdd3;' : '')) : '';
            return `<button class="btn" data-i="${i}" style="${color}">${String.fromCharCode(65+i)}. ${c}</button>`;
          }).join('')}
        </div>
        ${selected != null ? `<div class="alert" style="margin-top:.75rem;"><strong>Answer: ${String.fromCharCode(65+q.answer_index)}</strong><div style="margin-top:.25rem;">${q.explanation}</div></div>` : ''}
      `;
      stats.textContent = `Correct ${fmt(state.correct)} / ${fmt(state.answered)} • ${fmt(state.total - state.answered)} remaining`;
      bar.style.width = state.answered ? (100*state.answered/Math.max(state.total||1,1))+'%' : '0%';
      root.querySelectorAll('button.btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (userAnswers[qId] != null) return; // already answered
          const choice = Number(btn.dataset.i);
          userAnswers[qId] = choice;
          recomputeProgress();
          saveState(); saveAnswers(); render();
        });
      });
    }

    prevBtn?.addEventListener('click', ()=>{ state.idx = Math.max(0, state.idx-1); saveState(); render(); });
    nextBtn?.addEventListener('click', ()=>{ state.idx = Math.min(state.order.length-1, state.idx+1); saveState(); render(); });
    shuffleBtn?.addEventListener('click', ()=>{
      state.order = state.order.sort(()=>Math.random()-0.5);
      state.idx = 0;
      recomputeProgress();
      saveState();
      render();
    });
    resetBtn?.addEventListener('click', ()=>{
      state.idx = 0;
      userAnswers = {};
      recomputeProgress();
      saveState(); saveAnswers(); render();
    });

    loadQuestions();
  </script>
  `;
}
