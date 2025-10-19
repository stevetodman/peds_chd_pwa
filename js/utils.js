export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export const html = (strings, ...vals) => strings.map((s, i) => s + (vals[i] ?? '')).join('');
export function setView(content) { const app = document.getElementById('app'); app.innerHTML = content; }
export function fmt(n, d=0) { return Number(n).toFixed(d); }
export function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
export function load(k, fallback=null) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } }
export function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {position:'fixed', bottom:'1rem', left:'50%', transform:'translateX(-50%)', background:'#111827', color:'#fff', padding:'.6rem .8rem', borderRadius:'.5rem', zIndex:9999});
  document.body.appendChild(t); setTimeout(()=>t.remove(), 2200);
}
