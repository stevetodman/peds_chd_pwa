import { setView } from './utils.js';
import home from './pages/home.js';
import lecture from './pages/lecture.js';
import qbank from './pages/qbank.js';
import cxr from './pages/cxr.js';
import ekg from './pages/ekg.js';

const routes = {
  '': home,
  'home': home,
  'lecture': lecture,
  'qbank': qbank,
  'cxr': cxr,
  'ekg': ekg
};

export function navTo(hash) {
  const target = (!hash || hash === '#') ? '#/home' : hash;
  const [, rawPath = 'home'] = target.split('#/');
  const path = rawPath || 'home';
  const resolvedPath = routes[path] ? path : 'home';
  const page = routes[resolvedPath] || home;
  const normalizedHash = `#/${resolvedPath}`;

  if (target !== normalizedHash && location.hash !== normalizedHash) {
    location.replace(normalizedHash);
  }

  const view = page();
  setView(view);
  const tabs = document.querySelectorAll('.tabs a');
  tabs.forEach((link) => {
    const isActive = link.getAttribute('href') === normalizedHash;
    link.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function handleRoute() {
  navTo(location.hash);
}

if (document.readyState !== 'loading') {
  handleRoute();
}

window.addEventListener('DOMContentLoaded', handleRoute, { once: false });
window.addEventListener('hashchange', handleRoute);
