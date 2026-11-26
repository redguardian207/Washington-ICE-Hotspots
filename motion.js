/* motion.js: smooth animation for Washington ICE.
   Cards fade and slide in as you scroll, photos slowly zoom and pan,
   buttons press in when tapped. Turns itself off when a visitor's
   device asks for reduced motion. Delete the <script src="motion.js">
   line in index.html to remove all of it. */
(() => {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const css = `
html{scroll-behavior:smooth}
.mo-in{opacity:0;transform:translateY(28px) scale(.98);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.mo-in.mo-show{opacity:1;transform:none}
.mo-kb{overflow:hidden}
.mo-kb>img,img.mo-kbimg{animation:mo-kb 14s ease-in-out infinite alternate;transform-origin:center;will-change:transform}
.mo-kb:nth-of-type(2n)>img{animation-name:mo-kb2}
@keyframes mo-kb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-2%,-2%)}}
@keyframes mo-kb2{from{transform:scale(1.12) translate(2%,1%)}to{transform:scale(1) translate(0,0)}}
.hs button,.st-btn,.hs-seg button{transition:transform .12s ease,background-color .2s,color .2s}
.hs button:active,.st-btn:active,.hs-seg button:active{transform:scale(.95)}
.hs-tile{transition:transform .25s ease,box-shadow .25s ease}
.hs-tile:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(224,20,30,.18)}
.hs-tile .v.mo-pop{animation:mo-pop .6s ease}
@keyframes mo-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
`;
  const st = document.createElement('style');
  st.id = 'motion-css';
  st.textContent = css;
  document.head.appendChild(st);

  const BLOCKS = '.hs-card,.hs-tile,.hs-active,.hs-take,.hs-caveat,[class^="st-"][class$="wrap"],.st-news,.st-social,.st-grid>*';
  const seen = new WeakSet();

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          el.classList.add('mo-show');
          el.querySelectorAll('.hs-tile .v').forEach((v) => v.classList.add('mo-pop'));
          if (el.matches('.hs-tile')) el.querySelector('.v')?.classList.add('mo-pop');
          io.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

  const prep = (root) => {
    if (!io) return;
    root.querySelectorAll(BLOCKS).forEach((el, i) => {
      if (seen.has(el)) return;
      seen.add(el);
      // Things already on screen at load just show, so nothing flashes.
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && document.readyState !== 'complete') return;
      el.classList.add('mo-in');
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
    // Slow zoom and pan on story and news photos.
    root.querySelectorAll('[class^="st-"] img, [class*=" st-"] img').forEach((img) => {
      if (seen.has(img)) return;
      seen.add(img);
      const box = img.parentElement;
      if (box && box.children.length === 1 && !box.matches('main,.hs,body')) box.classList.add('mo-kb');
      else img.classList.add('mo-kbimg');
    });
  };

  const start = () => {
    prep(document);
    // The stories and schools sections are drawn after the page loads.
    new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) prep(n.parentElement || n); });
    }).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
