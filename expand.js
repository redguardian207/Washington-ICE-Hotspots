/* expand.js: every section can open full screen.
   Each section gets an "Expand" button (and its picture can be clicked too).
   The real section moves into a full-screen view, so everything in it still works,
   and goes back where it was when you close it (Close button, Esc, or click outside).
   Remove the <script src="expand.js"> line in index.html to take it off. */
(() => {
  const RED = '#e0141e';
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ES = () => { try { return localStorage.getItem('site-lang') === 'es'; } catch (e) { return false; } };
  const T = (en, es) => (ES() ? es : en);

  const css = `
.xp-btn{display:inline-flex;align-items:center;gap:6px;justify-self:end;align-self:end;margin-top:6px;font:inherit;font-weight:700;font-size:.85rem;color:${RED};background:#fff;border:1.5px solid ${RED};border-radius:999px;padding:6px 14px;cursor:pointer;transition:background .2s,color .2s,transform .12s}
.xp-btn:hover,.xp-btn:focus-visible{background:${RED};color:#fff;outline:none}
.xp-btn:active{transform:scale(.95)}
.xp-btn svg{width:14px;height:14px}
#totals > .xp-btn{grid-column:1/-1}
.vz{cursor:zoom-in}
.xp-ov{position:fixed;inset:0;z-index:3000;display:flex;justify-content:center;align-items:flex-start;overflow-y:auto;padding:24px 16px 40px;box-sizing:border-box;
  background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transition:opacity .35s ease}
.xp-ov.on{opacity:1}
.xp-box{position:relative;width:min(1180px,100%);transform:translateY(24px) scale(.96);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.xp-ov.on .xp-box{transform:none}
.xp-close{position:sticky;top:0;float:right;z-index:5;margin:0 0 -44px;font:inherit;font-weight:800;font-size:.95rem;color:#fff;background:${RED};border:0;border-radius:999px;padding:10px 18px;cursor:pointer;box-shadow:0 6px 20px rgba(224,20,30,.35)}
.xp-box > section{margin:0!important;max-width:none!important;width:100%!important;box-sizing:border-box;font-size:1.08rem;box-shadow:0 30px 80px -30px rgba(0,0,0,.35)}
.xp-box > section .xp-btn{display:none}
.xp-box .vz{height:clamp(170px,26vw,300px);cursor:default}
.xp-box #map3d .m3-stage{height:calc(100vh - 210px);min-height:420px}
.xp-box .hs-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding:24px;background:#fff;border-radius:22px}
body.xp-lock{overflow:hidden}
@media (max-width:640px){.xp-ov{padding:12px 8px 30px}.xp-box #map3d .m3-stage{height:calc(100vh - 230px);min-height:340px}}
`;
  const ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 2h4v4M6 14H2v-4M14 2L9 7M2 14l5-5"/></svg>';

  let open = null;

  function close() {
    if (!open) return;
    const { ov, sec, mark, back } = open;
    open = null;
    ov.classList.remove('on');
    setTimeout(() => {
      mark.parentNode.insertBefore(sec, mark); mark.remove(); ov.remove();
      document.body.classList.remove('xp-lock');
      window.dispatchEvent(new Event('resize'));
      if (back) back.focus({ preventScroll: true });
      sec.scrollIntoView({ block: 'start' });
    }, REDUCED ? 0 : 300);
  }

  function expand(sec, from) {
    if (open) close();
    const mark = document.createComment('xp');
    sec.parentNode.insertBefore(mark, sec);
    const ov = document.createElement('div');
    ov.className = 'xp-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    const box = document.createElement('div');
    box.className = 'xp-box';
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'xp-close'; x.textContent = '✕ ' + T('Close', 'Cerrar');
    box.appendChild(x); box.appendChild(sec); ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('xp-lock');
    open = { ov, sec, mark, back: from };
    // Replay the section picture so it draws in again, bigger.
    const vz = sec.querySelector('.vz');
    if (vz && !REDUCED) { vz.classList.remove('on'); setTimeout(() => vz.classList.add('on'), 250); }
    requestAnimationFrame(() => { ov.classList.add('on'); window.dispatchEvent(new Event('resize')); });
    setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    x.addEventListener('click', close);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    x.focus({ preventScroll: true });
  }

  function add(sec) {
    if (sec.dataset.xp || sec.hidden || !sec.id) return;
    sec.dataset.xp = '1';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'xp-btn';
    b.innerHTML = ICON + '<span>' + T('Expand', 'Ampliar') + '</span>';
    b.addEventListener('click', () => expand(sec, b));
    sec.appendChild(b);
  }

  function scan() {
    document.querySelectorAll('section.hs-card, section#totals').forEach(add);
  }

  function start() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    // Clicking a section's picture opens that section too.
    document.addEventListener('click', (e) => {
      const vz = e.target.closest('.vz');
      if (!vz || open) return;
      const sec = vz.closest('section');
      if (sec) expand(sec, null);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    scan();
    // Some sections (schools, map) are added by other scripts after load.
    let n = 0; const t = setInterval(() => { scan(); if (++n > 20) clearInterval(t); }, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
