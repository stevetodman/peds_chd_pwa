import { html, load, save } from '../utils.js';

function shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }

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
    function loadAnswers() {
      const raw = localStorage.getItem('qbank_user_answers');
      if (!raw) return { version: 2, answers: {} };
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.version === 2 &&
          parsed.answers &&
          typeof parsed.answers === 'object'
        ) {
          return { version: 2, answers: parsed.answers };
        }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { version: 1, answers: parsed };
        }
      } catch (err) {
        console.warn('Unable to parse saved answers', err);
      }
      return { version: 2, answers: {} };
    }

    let answerStore = loadAnswers();

    function recomputeProgress() {
      let correct = 0;
      let answered = 0;
      Object.entries(answerStore.answers).forEach(([key, choice]) => {
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
    function saveAnswers() {
      localStorage.setItem('qbank_user_answers', JSON.stringify({ version: 2, answers: answerStore.answers }));
    }

    async function loadQuestions() {
      const res = await fetch('data/qbank.json');
      questions = await res.json();
      const prevOrder = Array.isArray(state.order) && state.order.length ? state.order.slice() : Array.from(questions.keys());
      if (!state.order || !state.order.length) {
        state.order = Array.from(questions.keys());
      }
      if (answerStore.version !== 2) {
        const remapped = {};
        Object.entries(answerStore.answers).forEach(([key, value]) => {
          const idx = Number(key);
          if (!Number.isInteger(idx)) return;
          const qIdx = prevOrder[idx];
          if (qIdx != null) remapped[qIdx] = value;
        });
        answerStore = { version: 2, answers: remapped };
        saveAnswers();
      }
      recomputeProgress();
      saveState();
      render();
    }

    function render() {
      const idx = Math.min(state.idx, state.order.length-1);
      const qId = state.order[idx];
      const q = questions[qId];
      if (!q) return;
      const selected = answerStore.answers[qId];
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
          if (answerStore.answers[qId] != null) return; // already answered
          const choice = Number(btn.dataset.i);
          answerStore.answers[qId] = choice;
          recomputeProgress();
          saveState(); saveAnswers(); render();
        });
      });
    }

    document.getElementById('prevBtn').addEventListener('click', ()=>{ state.idx = Math.max(0, state.idx-1); saveState(); render(); });
    document.getElementById('nextBtn').addEventListener('click', ()=>{ state.idx = Math.min(state.order.length-1, state.idx+1); saveState(); render(); });
    document.getElementById('shuffleBtn').addEventListener('click', ()=>{
      state.order = state.order.sort(()=>Math.random()-0.5);
      state.idx = 0;
      recomputeProgress();
      saveState();
      render();
    });
    document.getElementById('resetBtn').addEventListener('click', ()=>{
      state.idx = 0;
      answerStore = { version: 2, answers: {} };
      recomputeProgress();
      saveState(); saveAnswers(); render();
    });

    loadQuestions();
  </script>
  `;
}
