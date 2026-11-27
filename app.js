/* app.js: makes the site installable as an app.
   Registers sw.js (offline + auto updates) and shows a "Get the app" button when the phone or browser can install it.
   On iPhone, the button shows how to add it from Safari's Share menu. */
(() => {
  const RED = '#e0141e';
  const L = () => { try { return localStorage.getItem('site-lang') || 'en'; } catch (e) { return 'en'; } };
  const TX = {
    get: { en: 'Get the app', es: 'Instala la app', ar: 'ثبّت التطبيق', fa: 'نصب برنامه' },
    ios: { en: 'Tap the Share button, then "Add to Home Screen".', es: 'Toca Compartir y luego "Agregar a inicio".', ar: 'اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".', fa: 'دکمه اشتراک را بزنید، سپس «افزودن به صفحه اصلی».' },
    hide: { en: 'Hide', es: 'Ocultar', ar: 'إخفاء', fa: 'پنهان' }
  };
  const t = (k) => TX[k][L()] || TX[k].en;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}); });
  }

  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) { document.documentElement.classList.add('is-app'); return; }
  let hidden = false; try { hidden = localStorage.getItem('app-btn-hidden') === '1'; } catch (e) {}
  if (hidden) return;

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;

  const css = `
.ap-btn{position:fixed;right:16px;bottom:16px;z-index:2500;display:flex;align-items:center;gap:8px;font:inherit;font-weight:800;font-size:.95rem;color:#fff;background:${RED};border:0;border-radius:999px;padding:12px 18px 12px 14px;cursor:pointer;box-shadow:0 10px 30px -8px rgba(224,20,30,.6);animation:apIn .5s cubic-bezier(.2,.8,.2,1)}
.ap-btn img{width:24px;height:24px;border-radius:7px;background:#fff}
.ap-x{position:fixed;right:10px;bottom:62px;z-index:2501;font:inherit;font-size:.75rem;color:#555;background:#fff;border:1px solid #ddd;border-radius:999px;padding:3px 9px;cursor:pointer}
.ap-tip{position:fixed;right:16px;bottom:74px;z-index:2501;max-width:260px;background:#111;color:#fff;font-size:.92rem;line-height:1.35;padding:12px 14px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
@keyframes apIn{from{transform:translateY(30px);opacity:0}}
@media (prefers-reduced-motion:reduce){.ap-btn{animation:none}}`;

  function show() {
    if (document.querySelector('.ap-btn')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ap-btn';
    b.innerHTML = '<img src="icon-192.png" alt=""><span></span>'; b.querySelector('span').textContent = t('get');
    const x = document.createElement('button'); x.type = 'button'; x.className = 'ap-x'; x.textContent = t('hide');
    const done = () => { b.remove(); x.remove(); const tip = document.querySelector('.ap-tip'); if (tip) tip.remove(); };
    x.addEventListener('click', () => { try { localStorage.setItem('app-btn-hidden', '1'); } catch (e) {} done(); });
    b.addEventListener('click', async () => {
      if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; if (r && r.outcome === 'accepted') done(); return; }
      let tip = document.querySelector('.ap-tip');
      if (tip) { tip.remove(); return; }
      tip = document.createElement('div'); tip.className = 'ap-tip'; tip.textContent = t('ios'); document.body.appendChild(tip);
    });
    document.body.appendChild(b); document.body.appendChild(x);
  }

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; show(); });
  window.addEventListener('appinstalled', () => { const b = document.querySelector('.ap-btn'); if (b) b.remove(); const x = document.querySelector('.ap-x'); if (x) x.remove(); });
  if (ios) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show(); }
})();
