/* app.js: makes the site installable as an app.
   Registers sw.js (offline + auto updates) and shows a "Get the app" button when the phone or browser can install it.
   On iPhone, the button shows how to add it from Safari's Share menu. */
(() => {
  const RED = '#e0141e';
  const L = () => { try { return localStorage.getItem('site-lang') || 'en'; } catch (e) { return 'en'; } };
  const TX = {
    get: { en: 'Get the app', es: 'Instala la app', ar: 'ثبّت التطبيق', fa: 'نصب برنامه' },
    ios: { en: 'Tap the Share button, then "Add to Home Screen".', es: 'Toca Compartir y luego "Agregar a inicio".', ar: 'اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".', fa: 'دکمه اشتراک را بزنید، سپس «افزودن به صفحه اصلی».' },
    hide: { en: 'Hide', es: 'Ocultar', ar: 'إخفاء', fa: 'پنهان' },
    on: { en: 'Turn on alerts', es: 'Activar alertas', ar: 'تفعيل التنبيهات', fa: 'روشن کردن هشدارها' },
    live: { en: 'Alerts on', es: 'Alertas activas', ar: 'التنبيهات مفعّلة', fa: 'هشدارها روشن' },
    off: { en: 'Alerts are off. Tap the bell to turn them on again.', es: 'Las alertas están apagadas. Toca la campana para activarlas.', ar: 'التنبيهات متوقفة. اضغط الجرس لتفعيلها.', fa: 'هشدارها خاموش است. برای روشن کردن زنگ را بزنید.' },
    first: { en: 'On iPhone, add the app to your Home Screen first, then turn on alerts from the app.', es: 'En iPhone, primero agrega la app a tu pantalla de inicio y luego activa las alertas desde la app.', ar: 'على iPhone، أضف التطبيق إلى الشاشة الرئيسية أولاً ثم فعّل التنبيهات من التطبيق.', fa: 'در آیفون، اول برنامه را به صفحه اصلی اضافه کنید، سپس هشدارها را از داخل برنامه روشن کنید.' },
    blocked: { en: 'Notifications are blocked for this site. Allow them in your browser settings, then tap the bell again.', es: 'Las notificaciones están bloqueadas. Permítelas en la configuración del navegador y vuelve a tocar la campana.', ar: 'الإشعارات محظورة لهذا الموقع. اسمح بها من إعدادات المتصفح ثم اضغط الجرس مرة أخرى.', fa: 'اعلان‌ها برای این سایت مسدود است. در تنظیمات مرورگر اجازه دهید و دوباره زنگ را بزنید.' },
    done: { en: "Alerts are on. You'll get a notification when a new report is added.", es: 'Alertas activas. Recibirás una notificación cuando haya un reporte nuevo.', ar: 'التنبيهات مفعّلة. ستصلك رسالة عند إضافة تقرير جديد.', fa: 'هشدارها روشن است. با اضافه شدن گزارش تازه اعلان دریافت می‌کنید.' }
  };
  const t = (k) => TX[k][L()] || TX[k].en;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
        alertsInit(reg);
        const check = () => reg.update().catch(() => {});
        setInterval(check, 15 * 60 * 1000);
      }).catch(() => {});
    });
    // Auto-update: if the app sat in the background 5+ minutes, reload when it comes back
    // so people always get the newest version without reinstalling.
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
      if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000 && navigator.onLine) location.reload();
    });
    // When a new sw.js takes over, reload once so the page matches it
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
  }

  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Alerts: a bell at the bottom right. On = permission granted and the choice saved for the service worker.
  function alertsInit() {
    const st = document.createElement('style');
    st.textContent = `.al-btn{position:fixed;right:16px;bottom:74px;z-index:2500;display:flex;align-items:center;gap:7px;font:inherit;font-weight:800;font-size:.88rem;color:${RED};background:#fff;border:2px solid ${RED};border-radius:999px;padding:8px 14px;cursor:pointer;box-shadow:0 8px 24px -10px rgba(0,0,0,.35)}
.al-btn.on{color:#fff;background:${RED}}
.al-btn svg{width:16px;height:16px}
.is-app .al-btn,.al-solo .al-btn{bottom:16px}
.al-tip{position:fixed;right:16px;bottom:128px;z-index:2501;max-width:270px;background:#111;color:#fff;font-size:.92rem;line-height:1.35;padding:12px 14px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3)}`;
    document.head.appendChild(st);
    const bell = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'al-btn';
    let on = false; try { on = localStorage.getItem('alerts') === 'on'; } catch (e) {}
    const can = 'Notification' in window && 'serviceWorker' in navigator;
    if (on && (!can || Notification.permission !== 'granted')) on = false;
    const draw = () => { b.classList.toggle('on', on); b.innerHTML = bell + '<span></span>'; b.querySelector('span').textContent = on ? t('live') : t('on'); };
    const say = (k) => { let tip = document.querySelector('.al-tip'); if (tip) tip.remove(); tip = document.createElement('div'); tip.className = 'al-tip'; tip.textContent = t(k); document.body.appendChild(tip); setTimeout(() => tip.remove(), 6000); };
    const tell = (msg) => navigator.serviceWorker.ready.then((r) => r.active && r.active.postMessage(msg));
    const save = (v) => { on = v; try { localStorage.setItem('alerts', v ? 'on' : 'off'); } catch (e) {} tell({ type: 'alerts', on: v }); draw(); };
    b.addEventListener('click', async () => {
      if (on) { save(false); say('off'); return; }
      if (!can) { say(iosDevice && !standalone ? 'first' : 'blocked'); return; }
      const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (p !== 'granted') { say('blocked'); return; }
      save(true); say('done');
      try { const r = await navigator.serviceWorker.ready; if (r.periodicSync) await r.periodicSync.register('check-reports', { minInterval: 60 * 60 * 1000 }); } catch (e) {}
    });
    draw(); document.body.appendChild(b);
    if (on) tell({ type: 'check' });
  }

  if (standalone) { document.documentElement.classList.add('is-app'); return; }
  let hidden = false; try { hidden = localStorage.getItem('app-btn-hidden') === '1'; } catch (e) {}
  if (hidden) { document.documentElement.classList.add('al-solo'); return; }

  const ios = iosDevice;
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
    x.addEventListener('click', () => { try { localStorage.setItem('app-btn-hidden', '1'); } catch (e) {} done(); document.documentElement.classList.add('al-solo'); });
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
