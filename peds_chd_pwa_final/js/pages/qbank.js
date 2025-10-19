import { html, load } from '../utils.js';

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
    const state = JSON.parse(localStorage.getItem('qbank_state') || '{"idx":0,"correct":0,"answered":0,"order":[]}');
    let questions = [];
    let userAnswers = JSON.parse(localStorage.getItem('qbank_user_answers') || '{}');

    function saveState() { localStorage.setItem('qbank_state', JSON.stringify(state)); }
    function saveAnswers() { localStorage.setItem('qbank_user_answers', JSON.stringify(userAnswers)); }

    async function loadQuestions() {
      const res = await fetch('data/qbank.json');
      questions = await res.json();
      if (!state.order || !state.order.length) {
        state.order = Array.from(questions.keys());
      }
      state.total = questions.length;
      saveState();
      render();
    }

    function render() {
      const idx = Math.min(state.idx, state.order.length-1);
      const q = questions[state.order[idx]];
      if (!q) return;
      const selected = userAnswers[idx];
      root.innerHTML = \`
        <div><strong>Q\${idx+1} of \${state.order.length}</strong></div>
        <p style="margin-top:.5rem;">\${q.stem}</p>
        <div style="display:grid; gap:.5rem; margin-top: .5rem;">
          \${q.choices.map((c, i)=>{
            const isSel = selected === i;
            const correct = q.answer_index === i;
            const color = selected != null ? (correct ? 'background:#eaffea; border-color:#a7f3d0;' : (isSel ? 'background:#fff1f2; border-color:#fecdd3;' : '')) : '';
            return \`<button class="btn" data-i="\${i}" style="\${color}">\${String.fromCharCode(65+i)}. \${c}</button>\`;
          }).join('')}
        </div>
        \${selected != null ? \`<div class="alert" style="margin-top:.75rem;"><strong>Answer: \${String.fromCharCode(65+q.answer_index)}</strong><div style="margin-top:.25rem;">\${q.explanation}</div></div>\` : ''}
      \`;
      stats.textContent = \`Correct \${fmt(state.correct)} / \${fmt(state.answered)} • \${fmt(state.total - state.answered)} remaining\`;
      bar.style.width = state.answered ? (100*state.answered/Math.max(state.total||1,1))+'%' : '0%';
      root.querySelectorAll('button.btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (userAnswers[idx] != null) return; // already answered
          const choice = Number(btn.dataset.i);
          userAnswers[idx] = choice;
          if (choice === q.answer_index) state.correct += 1;
          state.answered += 1;
          saveState(); saveAnswers(); render();
        });
      });
    }

    document.getElementById('prevBtn').addEventListener('click', ()=>{ state.idx = Math.max(0, state.idx-1); saveState(); render(); });
    document.getElementById('nextBtn').addEventListener('click', ()=>{ state.idx = Math.min(state.order.length-1, state.idx+1); saveState(); render(); });
    document.getElementById('shuffleBtn').addEventListener('click', ()=>{
      state.order = state.order.sort(()=>Math.random()-0.5);
      state.idx = 0; state.correct = 0; state.answered = 0; userAnswers = {}; saveState(); saveAnswers(); render();
    });
    document.getElementById('resetBtn').addEventListener('click', ()=>{
      state.idx = 0; state.correct = 0; state.answered = 0; userAnswers = {}; saveState(); saveAnswers(); render();
    });

    loadQuestions();
  </script>
  `;
}
