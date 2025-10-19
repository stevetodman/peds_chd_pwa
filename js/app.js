import { navTo } from './router.js';
import { $, load, save } from './utils.js';

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  save('a2hs_ready', true);
  const btn = document.getElementById('installBtn');
  if (btn) btn.disabled = false;
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  save('a2hs_ready', false);
});

window.addEventListener('hashchange', () => navTo(location.hash));
window.addEventListener('load', () => navTo(location.hash || '#/home'));

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      document.getElementById('swStatus').textContent = 'Service worker: registered';
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available; reload to update.');
            }
          });
        }
      });
    } catch (err) {
      console.warn('SW registration failed', err);
      const s = document.getElementById('swStatus');
      if (s) s.textContent = 'Service worker: failed';
    }
  } else {
    const s = document.getElementById('swStatus');
    if (s) s.textContent = 'Service worker: unsupported';
  }
}
registerSW();

window.__triggerInstall = async function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install prompt outcome:', outcome);
    deferredPrompt = null;
    save('a2hs_ready', false);
  }
};

window.addEventListener('online', () => { const el=$('#net'); if (el) el.textContent='Online'; });
window.addEventListener('offline', () => { const el=$('#net'); if (el) el.textContent='Offline'; });
