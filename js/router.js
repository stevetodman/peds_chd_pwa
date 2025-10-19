import { setView } from './utils.js';
import home from './pages/home.js';
import lecture from './pages/lecture.js';
import qbank from './pages/qbank.js';
import cxr from './pages/cxr.js';
import ekg from './pages/ekg.js';

const routes = {
  '': home, 'home': home,
  'lecture': lecture,
  'qbank': qbank,
  'cxr': cxr,
  'ekg': ekg
};

export function navTo(hash) {
  if (!hash || hash === '#') hash = '#/home';
  const [, path] = hash.split('#/');
  const page = routes[path] || home;
  const view = page();
  setView(view);
  // set selected tab
  document.querySelectorAll('.tabs a').forEach(a => a.setAttribute('aria-selected', a.getAttribute('href') === '#/'+(path||'home') ? 'true' : 'false'));
}
