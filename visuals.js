/* visuals.js: an animated picture at the top of each section, matched to what the section shows.
   Towns, places, days and months are drawn from the real report data; the rest are illustrations.
   Each picture draws itself in when you scroll to it. Remove the <script src="visuals.js"> line
   in index.html to take them all off. */
(() => {
  const RED = '#e0141e', INK = '#111';
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
#cameras.hs-card{grid-template-columns:minmax(0,1fr)}
.vz{position:relative;min-width:0;height:118px;margin:2px 0 14px;border-radius:18px;overflow:hidden;
  background:radial-gradient(ellipse at 80% 0%,rgba(224,20,30,.10),rgba(224,20,30,0) 60%),linear-gradient(180deg,#fff,#fbf5f5);box-shadow:inset 0 0 0 1px rgba(224,20,30,.12)}
.vz svg{position:absolute;inset:0;width:100%;height:100%}
.vz .ln{fill:none;stroke:${INK};stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s cubic-bezier(.3,.7,.2,1)}
.vz .ln.r{stroke:${RED}}
.vz .fl{opacity:0;transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);transition:transform 1.1s cubic-bezier(.2,.8,.2,1),opacity .6s}
.vz .fd{opacity:0;transition:opacity .8s ease}
.vz.on .ln{stroke-dashoffset:0}
.vz.on .fl{opacity:1;transform:none}
.vz.on .fd{opacity:1}
.vz .tx{font:700 11px 'Source Sans 3',system-ui,sans-serif;fill:#333}
.vz .tx.b{font-size:13px;fill:${INK};font-weight:800}
.vz .sweep{transform-box:view-box;transform-origin:70px 59px;animation:vz-spin 4s linear infinite}
.vz .blink{animation:vz-blink 1.6s ease-in-out infinite}
.vz .bob{animation:vz-bob 3s ease-in-out infinite}
.vz .wave{transform-box:fill-box;transform-origin:0 50%;animation:vz-wave 1.8s ease-out infinite}
.vz .wave.d2{animation-delay:.6s}.vz .wave.d3{animation-delay:1.2s}
@keyframes vz-spin{to{transform:rotate(360deg)}}
@keyframes vz-blink{50%{opacity:.15}}
@keyframes vz-bob{50%{transform:translateY(-4px)}}
@keyframes vz-wave{0%{opacity:0;transform:scale(.6)}30%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
@media (prefers-reduced-motion: reduce){.vz *{animation:none!important;transition:none!important}.vz .ln{stroke-dashoffset:0}.vz .fl,.vz .fd{opacity:1;transform:none}}
@media (max-width:640px){.vz{height:96px}}
`;

  const L = (d, red, delay) => '<path class="ln' + (red ? ' r' : '') + '" pathLength="1" d="' + d + '"' + (delay ? ' style="transition-delay:' + delay + 's"' : '') + '/>';
  const svg = (inner) => '<svg viewBox="0 0 640 118" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + inner + '</svg>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Bars that grow from a baseline, with labels. Used for towns, places, days and months.
  function bars(items, opts) {
    const n = items.length; if (!n) return '';
    const max = Math.max(1, ...items.map((d) => d[1]));
    const x0 = opts.x0 || 40, x1 = 620, base = 92, top = 18, gap = opts.gap || 10;
    const w = (x1 - x0 - gap * (n - 1)) / n;
    let s = '<line class="ln" pathLength="1" x1="' + (x0 - 10) + '" y1="' + base + '" x2="' + (x1 + 6) + '" y2="' + base + '"/>';
    items.forEach(([k, v], i) => {
      const h = Math.max(3, (base - top) * v / max), x = x0 + i * (w + gap);
      const hot = v === max;
      s += '<rect class="fl" x="' + x.toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + Math.min(6, w / 3).toFixed(1) + '" fill="' + (hot ? RED : 'url(#vzg)') + '" style="transition-delay:' + (0.2 + i * 0.06).toFixed(2) + 's"/>';
      s += '<text class="tx fd" x="' + (x + w / 2).toFixed(1) + '" y="108" text-anchor="middle" style="transition-delay:' + (0.6 + i * 0.05).toFixed(2) + 's">' + esc(k) + '</text>';
      s += '<text class="tx b fd" x="' + (x + w / 2).toFixed(1) + '" y="' + (base - h - 5).toFixed(1) + '" text-anchor="middle" style="transition-delay:' + (0.9 + i * 0.05).toFixed(2) + 's">' + v + '</text>';
    });
    return '<defs><linearGradient id="vzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f8f"/><stop offset="1" stop-color="#f3c9c9"/></linearGradient></defs>' + s;
  }

  // Skyline: one building per town, height by number of reports.
  function skyline(rows) {
    const c = new Map(); rows.forEach((r) => r.town && c.set(r.town, (c.get(r.town) || 0) + 1));
    const top = [...c].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(1, ...top.map((d) => d[1]));
    const n = top.length, x0 = 30, gap = 14, w = (610 - x0 - gap * (n - 1)) / n, base = 92;
    let s = L('M10 92H630');
    top.forEach(([t, v], i) => {
      const h = 14 + 64 * v / max, x = x0 + i * (w + gap), y = base - h;
      s += '<path class="fl" d="M' + x + ' ' + base + 'V' + (y + 8) + 'L' + (x + w / 2) + ' ' + y + 'L' + (x + w) + ' ' + (y + 8) + 'V' + base + 'Z" fill="' + (i === 0 ? RED : 'url(#vzg)') + '" style="transition-delay:' + (0.2 + i * 0.08) + 's"/>';
      for (let wy = y + 16; wy < base - 8; wy += 12) for (let wx = x + 7; wx < x + w - 9; wx += 11) s += '<rect class="fd" x="' + wx + '" y="' + wy + '" width="5" height="6" rx="1" fill="#fff" opacity=".85" style="transition-delay:' + (0.9 + i * 0.08) + 's"/>';
      s += '<text class="tx fd" x="' + (x + w / 2) + '" y="108" text-anchor="middle" style="transition-delay:' + (0.7 + i * 0.06) + 's">' + esc(t) + '</text>';
      s += '<text class="tx b fd" x="' + (x + w / 2) + '" y="' + (y - 5) + '" text-anchor="middle" style="transition-delay:' + (1 + i * 0.06) + 's">' + v + '</text>';
    });
    return '<defs><linearGradient id="vzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f8f"/><stop offset="1" stop-color="#f3c9c9"/></linearGradient></defs>' + s;
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const PICS = {
    outlook: () => svg(
      '<circle class="fd" cx="70" cy="59" r="44" fill="rgba(224,20,30,.06)"/>' + L('M26 59a44 44 0 1 0 88 0a44 44 0 1 0 -88 0') + L('M48 59a22 22 0 1 0 44 0a22 22 0 1 0 -44 0', 0, .3)
      + '<g class="sweep"><path d="M70 59L70 15A44 44 0 0 1 108 37Z" fill="rgba(224,20,30,.25)"/></g>'
      + '<circle class="blink" cx="92" cy="40" r="4" fill="' + RED + '"/><circle class="blink" cx="54" cy="78" r="3" fill="' + RED + '" style="animation-delay:.8s"/>'
      + L('M150 80C210 80 230 40 290 46S380 86 440 60S540 24 610 30', 1, .4) + L('M150 92H620', 0, .2)
      + '<text class="tx b fd" x="150" y="24">Where past reports point next</text>'),
    patterns: () => svg(
      L('M20 64H140L160 30L182 98L204 44L222 76L240 64H330L350 22L372 104L394 50L412 70L430 64H620', 1)
      + '<circle class="blink" cx="350" cy="22" r="5" fill="' + RED + '"/>' + '<text class="tx b fd" x="24" y="24">Repeats in the reports</text>'),
    places: (rows) => {
      const c = new Map(); rows.forEach((r) => { const p = r.place_type || 'Not given'; if (p !== 'Not given') c.set(p, (c.get(p) || 0) + 1); });
      const it = [...c].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k.length > 16 ? k.slice(0, 15) + '…' : k, v]);
      return svg(it.length ? bars(it, { gap: 18 }) : L('M20 92H620'));
    },
    weekdays: (rows) => {
      const c = [0, 0, 0, 0, 0, 0, 0];
      rows.forEach((r) => { const d = Date.parse((r.date || '') + 'T12:00:00Z'); if (!isNaN(d)) c[new Date(d).getUTCDay()]++; });
      return svg(bars(DAYS.map((d, i) => [d, c[i]]), { gap: 20 }));
    },
    months: (rows) => {
      const c = new Map(); rows.forEach((r) => { const m = (r.date || '').slice(0, 7); if (m) c.set(m, (c.get(m) || 0) + 1); });
      const keys = [...c.keys()].sort().slice(-12);
      return svg(bars(keys.map((k) => [MON[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4), c.get(k)]), { gap: 8 }));
    },
    towns: (rows) => svg(skyline(rows)),
    list: () => svg(
      [0, 1, 2].map((i) => '<g class="bob" style="animation-delay:' + i * .4 + 's"><rect class="fd" x="' + (60 + i * 26) + '" y="' + (14 + i * 14) + '" width="220" height="62" rx="12" fill="#fff" stroke="' + (i === 2 ? RED : '#ddd') + '" stroke-width="2" style="transition-delay:' + i * .2 + 's"/>'
        + L('M' + (80 + i * 26) + ' ' + (36 + i * 14) + 'h120', i === 2, .3 + i * .2) + L('M' + (80 + i * 26) + ' ' + (54 + i * 14) + 'h170', 0, .5 + i * .2) + '</g>').join('')
      + L('M380 59a24 24 0 1 0 48 0a24 24 0 1 0 -48 0M421 76l26 26', 1, .6) + '<text class="tx b fd" x="470" y="64">Search every report</text>'),
    cameras: () => svg(
      L('M90 112V40') + L('M90 44H150') + '<rect class="fd" x="142" y="30" width="70" height="30" rx="8" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>'
      + L('M212 38L238 30V60L212 52', 0, .4) + '<circle cx="158" cy="45" r="5" fill="' + RED + '" class="blink"/>'
      + L('M240 104C330 104 380 70 470 70S590 92 630 92', 0, .3) + L('M240 112C330 112 390 82 470 82S590 104 630 104', 0, .5)
      + '<path class="fd" d="M262 45l120 30l-120 18Z" fill="rgba(224,20,30,.12)"/><text class="tx b fd" x="420" y="30">Live highway cameras</text>'),
    locate: () => svg(
      L('M120 92c0-22 18-34 40-34s40 12 40 34') + L('M140 36a20 20 0 1 0 40 0a20 20 0 1 0 -40 0')
      + '<g class="bob">' + L('M214 34a30 30 0 1 0 60 0a30 30 0 1 0 -60 0M265 56l30 30', 1, .4) + '</g>'
      + '<text class="tx b fd" x="320" y="50">Official ICE detainee search</text><text class="tx fd" x="320" y="70">Name, country and birth date, or A-number</text>'),
    plates: () => svg(
      L('M70 84V66l24-26h120l30 26h26v18') + L('M100 84a14 14 0 1 0 28 0a14 14 0 1 0 -28 0M224 84a14 14 0 1 0 28 0a14 14 0 1 0 -28 0', 0, .3)
      + '<rect class="fd" x="270" y="64" width="64" height="26" rx="4" fill="#fff" stroke="' + RED + '" stroke-width="2.2"/><text class="tx b fd" x="302" y="82" text-anchor="middle">WA ••••</text>'
      + L('M400 30h40v26h-40zM440 38l14-6v22l-14-6', 0, .5) + '<path class="fd" d="M392 50L320 74L320 80Z" fill="rgba(224,20,30,.18)"/><text class="tx b fd" x="480" y="50">Plate cameras</text>'),
    help: () => svg(
      '<g class="bob">' + L('M110 20h56a8 8 0 0 1 8 8v68a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z') + L('M130 92h16', 0, .3) + '</g>'
      + '<path class="wave" d="M190 40a26 26 0 0 1 0 36" fill="none" stroke="' + RED + '" stroke-width="3"/><path class="wave d2" d="M204 30a40 40 0 0 1 0 56" fill="none" stroke="' + RED + '" stroke-width="3"/><path class="wave d3" d="M218 20a54 54 0 0 1 0 76" fill="none" stroke="' + RED + '" stroke-width="3"/>'
      + L('M320 52c-12-16-36-6-28 12l28 24l28-24c8-18-16-28-28-12z', 1, .4)
      + '<text class="tx b fd" x="380" y="52">Free legal help and hotlines</text><text class="tx fd" x="380" y="72">You have rights, whatever your status</text>'),
    schools: () => svg(
      L('M60 100V56l70-32l70 32v44') + L('M40 100H220', 0, .2) + L('M118 100V74h24v26', 0, .4) + L('M130 24V6l22 6l-22 6', 1, .6)
      + L('M80 62h16v14h-16zM164 62h16v14h-16z', 0, .5)
      + '<text class="tx b fd" x="260" y="52">Know your rights at school</text><text class="tx fd" x="260" y="72">Find your school, get help, share your story</text>'),
    report: () => svg(
      L('M90 50v20l70 22V28z') + L('M70 48h20v24H70z', 0, .2) + L('M104 74l8 26h14l-6-22', 0, .4)
      + '<path class="wave" d="M176 44a20 20 0 0 1 0 32" fill="none" stroke="' + RED + '" stroke-width="3"/><path class="wave d2" d="M190 34a34 34 0 0 1 0 52" fill="none" stroke="' + RED + '" stroke-width="3"/><path class="wave d3" d="M204 24a48 48 0 0 1 0 72" fill="none" stroke="' + RED + '" stroke-width="3"/>'
      + '<text class="tx b fd" x="260" y="52">Saw something? Tell us.</text><text class="tx fd" x="260" y="72">Checked against a second source before it goes up</text>')
  };

  function place(id, html) {
    const sec = document.getElementById(id);
    if (!sec || sec.querySelector(':scope > .vz')) return false;
    // The page wraps some headings in a .hs-cardhead box; put the picture under that box.
    const h2 = sec.querySelector(':scope > .hs-cardhead') || sec.querySelector(':scope > h2');
    if (!h2) return false;
    const box = document.createElement('div');
    box.className = 'vz';
    box.innerHTML = html;
    h2.insertAdjacentElement('afterend', box);
    if (REDUCED || !('IntersectionObserver' in window)) { box.classList.add('on'); return true; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { box.classList.add('on'); io.disconnect(); } }), { threshold: 0.35 });
    io.observe(box);
    return true;
  }

  function start(rows) {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const todo = new Set(Object.keys(PICS));
    const run = () => todo.forEach((id) => { try { if (place(id, PICS[id](rows))) todo.delete(id); } catch (e) { todo.delete(id); } });
    run();
    // The schools section is added by another script after load.
    let n = 0; const t = setInterval(() => { run(); if (!todo.size || ++n > 20) clearInterval(t); }, 600);
  }

  const go = () => fetch('data.json', { cache: 'no-store' }).then((r) => r.json()).then(start).catch(() => start([]));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
