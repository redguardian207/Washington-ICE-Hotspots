/* map3d.js: map of Washington that tilts into 3D.
   Red columns stand on each town; the taller the column, the more reports.
   Click the map and it tilts up, the columns rise, and you can drag to turn it.
   Built with plain HTML and CSS 3D, so it works in every browser with no map
   service. Remove the <script src="map3d.js"> line in index.html to take it off. */
(() => {
  const RED = '#e0141e';
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ES = () => { try { return localStorage.getItem('site-lang') === 'es'; } catch (e) { return false; } };
  const T = (en, es) => (ES() ? es : en);

  // Town coordinates [lat, lon] from OpenStreetMap.
  const GEO = {
    'Seattle': [47.6038, -122.3301], 'Kent': [47.3827, -122.227], 'Tacoma': [47.2455, -122.4383],
    'Vancouver': [45.6307, -122.6745], 'Federal Way': [47.3135, -122.3393], 'Auburn': [47.3075, -122.2302],
    'Everett': [47.9793, -122.2127], 'Bellingham': [48.7544, -122.4788], 'Burien': [47.4699, -122.3485],
    'Lynnwood': [47.8279, -122.3054], 'Spokane': [47.6572, -117.4235], 'Port Orchard': [47.5316, -122.6384],
    'Renton': [47.4799, -122.2034], 'Bellevue': [47.6144, -122.1923], 'Olympia': [47.0451, -122.895],
    'Yakima': [46.6016, -120.5108], 'Bothell': [47.7623, -122.2054], 'Shoreline': [47.7565, -122.3437],
    'Lynden': [48.9466, -122.4569], 'Lakewood': [47.1718, -122.5185], 'Longview': [46.1377, -122.9345],
    'Mill Creek': [47.8577, -122.2211], 'Mount Vernon': [48.42, -122.3264], 'Lacey': [47.0264, -122.8072],
    'Mountlake Terrace': [47.791, -122.3066], 'Sunnyside': [46.3246, -120.0082], 'Laurel': [48.8567, -122.486],
    'Bow': [48.5611, -122.4081], 'Wapato': [46.4476, -120.4203], 'Pasco': [46.2307, -119.0921],
    'Woodland': [45.9018, -122.746], 'Toppenish': [46.3775, -120.3089], 'Wenatchee': [47.4235, -120.3103],
    'Tukwila': [47.4627, -122.2559], 'Granite Falls': [48.0818, -121.9695], 'Everson': [48.9201, -122.3426],
    'Redmond': [47.6694, -122.1239], 'Puyallup': [47.1849, -122.2921], 'Hoodsport': [47.402, -123.1535],
    'Fife': [47.236, -122.3626], 'Spokane Valley': [47.6571, -117.2614]
  };

  // Washington State outline (simplified, public domain US state boundaries).
  const WA = [
    [[-117.033,49],[-117.044,47.762],[-117.039,46.426],[-117.055,46.344],[-116.924,46.169],[-116.918,45.993],[-118.989,45.999],[-119.126,45.933],[-119.525,45.911],[-119.964,45.824],[-120.21,45.725],[-120.506,45.698],[-120.637,45.747],[-121.185,45.605],[-121.218,45.67],[-121.535,45.725],[-121.809,45.709],[-122.247,45.55],[-122.762,45.659],[-122.812,45.961],[-122.905,46.081],[-123.118,46.185],[-123.211,46.174],[-123.37,46.147],[-123.545,46.262],[-123.726,46.3],[-123.874,46.24],[-124.066,46.327],[-124.027,46.464],[-123.896,46.536],[-124.099,46.744],[-124.236,47.286],[-124.318,47.357],[-124.427,47.741],[-124.624,47.888],[-124.707,48.184],[-124.597,48.381],[-124.394,48.288],[-123.984,48.162],[-123.704,48.168],[-123.425,48.118],[-123.162,48.168],[-123.036,48.08],[-122.801,48.086],[-122.636,47.867],[-122.516,47.883],[-122.494,47.587],[-122.423,47.319],[-122.324,47.346],[-122.423,47.576],[-122.395,47.801],[-122.231,48.031],[-122.362,48.124],[-122.373,48.288],[-122.472,48.469],[-122.423,48.6],[-122.488,48.754],[-122.647,48.776],[-122.795,48.891],[-122.757,49],[-117.033,49]],
    [[-122.718,48.31],[-122.587,48.354],[-122.609,48.151],[-122.768,48.228],[-122.718,48.31]],
    [[-123.025,48.584],[-122.916,48.715],[-122.768,48.557],[-122.812,48.42],[-123.042,48.458],[-123.025,48.584]]
  ];
  const W = 1000, LON0 = -124.85, LON1 = -116.85, LAT0 = 45.5, LAT1 = 49.08, K = Math.cos(47.3 * Math.PI / 180);
  const H = Math.round(W * (LAT1 - LAT0) / ((LON1 - LON0) * K));
  const px = (lon, lat) => [(lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H];

  const css = `
#map3d .m3-stage{position:relative;height:560px;border-radius:24px;overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:pan-y;
  background:radial-gradient(ellipse at 50% 35%,#ffffff 0%,#f6f3f3 55%,#ebe4e4 100%);box-shadow:0 30px 70px -35px rgba(224,20,30,.45),0 0 0 1px rgba(0,0,0,.06);perspective:1300px;perspective-origin:50% 30%}
#map3d .m3-world{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;margin:${-H / 2}px 0 0 ${-W / 2}px;transform-style:preserve-3d;transition:transform 2.4s cubic-bezier(.2,.75,.15,1);will-change:transform}
#map3d .m3-world.drag{transition:none}
#map3d .m3-world svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
#map3d .m3-land{fill:url(#m3-fill);stroke:${RED};stroke-width:2.5;stroke-linejoin:round;filter:drop-shadow(0 0 14px rgba(224,20,30,.35))}
#map3d .m3-grid{stroke:rgba(224,20,30,.10);stroke-width:1}
#map3d .m3-col{position:absolute;width:0;height:0;transform-style:preserve-3d}
#map3d .m3-bar{position:absolute;left:0;top:0;transform-style:preserve-3d;transform-origin:0 0;transform:rotateX(-90deg)}
#map3d .m3-face{position:absolute;bottom:0;left:calc(var(--w) * -.5);width:var(--w);height:var(--h);transform-origin:50% 100%;
  background:linear-gradient(0deg,#7d0006 0%,${RED} 55%,#ff6a6a 100%);box-shadow:0 0 18px rgba(224,20,30,.55);border-radius:3px 3px 0 0;
  transform:scaleY(var(--g,0));transition:transform 1.6s cubic-bezier(.2,.8,.2,1)}
#map3d .m3-face.b{transform:rotateY(90deg) scaleY(var(--g,0));filter:brightness(.82)}
#map3d .m3-dot{position:absolute;width:calc(var(--w) * 1.9);height:calc(var(--w) * 1.9);margin:calc(var(--w) * -.95) 0 0 calc(var(--w) * -.95);border-radius:50%;background:radial-gradient(circle,rgba(224,20,30,.9) 0%,rgba(224,20,30,.35) 45%,rgba(224,20,30,0) 70%);animation:m3-beat 2.4s ease-in-out infinite}
@keyframes m3-beat{50%{transform:scale(1.35);opacity:.7}}
#map3d .m3-lbl{position:absolute;left:0;top:0;transform-style:preserve-3d;pointer-events:none}
#map3d .m3-lbl span{position:absolute;bottom:0;left:0;transform:translateX(-50%);white-space:nowrap;font-weight:800;font-size:22px;color:#111;background:rgba(255,255,255,.9);padding:3px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.15);opacity:0;transition:opacity .8s ease 1.4s}
#map3d .m3-lbl span em{font-style:normal;color:${RED};margin-left:6px}
#map3d.is3d .m3-lbl span{opacity:1}
#map3d .m3-veil{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;padding-bottom:34px;transition:opacity .8s ease;z-index:3;pointer-events:none}
#map3d.is3d .m3-veil{opacity:0}
#map3d .m3-go{pointer-events:auto;font:inherit;font-weight:800;font-size:1.05rem;color:#fff;background:${RED};border:0;border-radius:999px;padding:14px 28px;cursor:pointer;animation:m3-pulse 2.2s ease-out infinite}
@keyframes m3-pulse{0%{box-shadow:0 0 0 0 rgba(224,20,30,.55)}100%{box-shadow:0 0 0 24px rgba(224,20,30,0)}}
#map3d .m3-ctl{position:absolute;top:14px;right:14px;z-index:4;display:flex;gap:6px}
#map3d .m3-ctl[hidden],#map3d .m3-top[hidden]{display:none}
#map3d .m3-ctl button{font:inherit;font-weight:700;font-size:.85rem;border:0;border-radius:999px;padding:8px 14px;background:rgba(255,255,255,.94);color:#000;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.12)}
#map3d .m3-ctl button.on{background:${RED};color:#fff}
#map3d .m3-top{position:absolute;right:14px;bottom:14px;z-index:4;background:rgba(255,255,255,.94);border-radius:16px;padding:10px 14px;font-size:.88rem;box-shadow:0 2px 12px rgba(0,0,0,.12);min-width:170px}
#map3d .m3-top b{display:block;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:${RED};margin-bottom:4px}
#map3d .m3-top div{display:flex;align-items:center;gap:8px;margin:3px 0}
#map3d .m3-top i{display:inline-block;height:7px;border-radius:4px;background:linear-gradient(90deg,#ff8a8a,${RED})}
#map3d .m3-top span{margin-left:auto;font-weight:800}
#map3d .m3-tip{position:absolute;z-index:5;pointer-events:none;background:#111;color:#fff;font-size:.9rem;padding:6px 10px;border-radius:10px;transform:translate(-50%,-130%);white-space:nowrap;opacity:0;transition:opacity .15s}
#map3d .m3-tip.on{opacity:1}
@media (max-width:640px){#map3d .m3-stage{height:420px;border-radius:18px}#map3d .m3-top{display:none}#map3d .m3-ctl button{padding:7px 11px}}
`;

  function build() {
    if (document.getElementById('map3d')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const sec = document.createElement('section');
    sec.className = 'hs-card';
    sec.id = 'map3d';
    sec.innerHTML = '<h2>' + T('Map of reports', 'Mapa de reportes') + '</h2>'
      + '<p class="note">' + T('Each red column stands on a town. The taller the column, the more reports there. Click the map to see it in 3D, then drag to turn it.', 'Cada columna roja está sobre una ciudad. Cuanto más alta, más reportes. Haz clic en el mapa para verlo en 3D y arrastra para girarlo.') + '</p>'
      + '<div class="m3-stage" role="img"><div class="m3-world"></div>'
      + '<div class="m3-veil"><button class="m3-go" type="button">' + T('View in 3D', 'Ver en 3D') + '</button></div>'
      + '<div class="m3-ctl" hidden><button type="button" data-v="2d">' + T('Flat', 'Plano') + '</button><button type="button" data-v="3d" class="on">3D</button><button type="button" data-v="spin">' + T('Spin', 'Girar') + '</button></div>'
      + '<div class="m3-top" hidden></div><div class="m3-tip"></div></div>';
    const after = document.getElementById('totals');
    if (after && after.parentNode) after.parentNode.insertBefore(sec, after.nextSibling);
    else (document.querySelector('main') || document.body).appendChild(sec);
    // Point the "See the map" button at the top of the page to this map.
    const relink = () => { const a = document.querySelector('a.st-btn[href="#st-skip"]'); if (a) { a.setAttribute('href', '#map3d'); return true; } return false; };
    if (!relink()) { let n = 0; const t = setInterval(() => { if (relink() || ++n > 20) clearInterval(t); }, 500); }
    fetch('data.json', { cache: 'no-store' }).then((r) => r.json()).then((rows) => draw(sec, rows)).catch(() => {
      sec.querySelector('.m3-world').innerHTML = '<p style="padding:40px;text-align:center">' + T('The map could not load. Try reloading the page.', 'No se pudo cargar el mapa. Vuelve a cargar la página.') + '</p>';
    });
  }

  function draw(sec, rows) {
    const stage = sec.querySelector('.m3-stage'), world = sec.querySelector('.m3-world'), tip = sec.querySelector('.m3-tip');
    const counts = new Map();
    rows.forEach((r) => { if (r.town && GEO[r.town]) counts.set(r.town, (counts.get(r.town) || 0) + 1); });
    const max = Math.max(1, ...counts.values());
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);

    let grid = '';
    for (let x = 0; x <= W; x += 50) grid += '<line class="m3-grid" x1="' + x + '" y1="-200" x2="' + x + '" y2="' + (H + 200) + '"/>';
    for (let y = -200; y <= H + 200; y += 50) grid += '<line class="m3-grid" x1="-150" y1="' + y + '" x2="' + (W + 150) + '" y2="' + y + '"/>';
    const path = WA.map((ring) => 'M' + ring.map(([lo, la]) => px(lo, la).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
    world.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="m3-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e6e6"/></linearGradient></defs>' + grid + '<path class="m3-land" d="' + path + '"/></svg>';

    // Smaller towns first so the tallest columns draw on top.
    sorted.slice().reverse().forEach(([town, n], i) => {
      const [x, y] = px(GEO[town][1], GEO[town][0]);
      const h = Math.round(30 + 330 * Math.sqrt(n / max));
      const w = Math.round(8 + 8 * Math.sqrt(n / max));
      const col = document.createElement('div');
      col.className = 'm3-col';
      col.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--w:' + w + 'px;--h:' + h + 'px;z-index:' + (i + 1);
      col.dataset.t = town; col.dataset.n = n;
      col.innerHTML = '<div class="m3-dot"></div><div class="m3-bar"><div class="m3-face"></div><div class="m3-face b"></div></div>';
      world.appendChild(col);
    });
    sorted.slice(0, 4).forEach(([town, n]) => {
      const [x, y] = px(GEO[town][1], GEO[town][0]);
      const h = Math.round(30 + 330 * Math.sqrt(n / max));
      const l = document.createElement('div');
      l.className = 'm3-lbl';
      l.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
      l.innerHTML = '<div style="position:absolute;transform-style:preserve-3d;transform:rotateX(-90deg);transform-origin:0 0"><span class="m3-l" style="bottom:' + (h + 12) + 'px">' + town + '<em>' + n + '</em></span></div>';
      world.appendChild(l);
    });
    sec.querySelector('.m3-top').innerHTML = '<b>' + T('Most reports', 'Más reportes') + '</b>'
      + sorted.slice(0, 5).map(([t, n]) => '<div>' + t + ' <i style="width:' + Math.round(16 + 56 * n / max) + 'px"></i><span>' + n + '</span></div>').join('');

    // Labels sit inside the tilted world, so they need the same counter-rotation as the bars.
    let fit = 1, tilt = 0, turn = 0, is3d = false, spin = false, raf = 0;
    const size = () => { fit = Math.min(stage.clientWidth / (W * 1.02), stage.clientHeight / (H * 1.05)); apply(); };
    function apply() {
      const z = is3d ? fit * 0.95 : fit;
      world.style.transform = 'translateY(' + (is3d ? 70 * fit : 0) + 'px) scale(' + z + ') rotateX(' + tilt + 'deg) rotateZ(' + turn + 'deg)';
      world.querySelectorAll('.m3-lbl > div').forEach((d) => { d.style.transform = 'rotateX(-90deg) rotateY(' + (-turn) + 'deg)'; });
    }
    const grow = (on) => {
      world.querySelectorAll('.m3-col').forEach((c, i, all) => {
        const delay = REDUCED ? 0 : on ? 0.5 + (all.length - i) * 0.035 : 0;
        c.querySelectorAll('.m3-face').forEach((f) => { f.style.transitionDelay = delay + 's'; });
        c.style.setProperty('--g', on ? 1 : 0);
      });
    };
    const mark = (v) => sec.querySelectorAll('.m3-ctl button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    const stopSpin = () => { spin = false; cancelAnimationFrame(raf); };
    const go3d = () => {
      if (is3d) return;
      is3d = true; sec.classList.add('is3d');
      sec.querySelector('.m3-ctl').hidden = false; sec.querySelector('.m3-top').hidden = false;
      tilt = 55; turn = -16; mark('3d'); apply(); grow(true);
    };
    const go2d = () => { stopSpin(); is3d = false; sec.classList.remove('is3d'); tilt = 0; turn = 0; mark('2d'); apply(); grow(false); };
    const doSpin = () => { if (!spin) return; turn -= 0.12; apply(); raf = requestAnimationFrame(doSpin); };

    sec.querySelector('.m3-ctl').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.v === '2d') go2d();
      else if (b.dataset.v === '3d') { stopSpin(); go3d(); mark('3d'); }
      else { if (spin) { stopSpin(); mark('3d'); return; } go3d(); mark('spin'); spin = true; world.classList.add('drag'); if (!REDUCED) doSpin(); }
    });

    // Click to tilt; drag sideways to turn.
    let down = null, moved = false;
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('.m3-ctl')) return; down = { x: e.clientX, turn }; moved = false; });
    stage.addEventListener('pointermove', (e) => {
      const c = e.target.closest('.m3-col');
      if (c) { const r = stage.getBoundingClientRect(); tip.textContent = c.dataset.t + ': ' + c.dataset.n + ' ' + (c.dataset.n === '1' ? T('report', 'reporte') : T('reports', 'reportes')); tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.classList.add('on'); }
      else tip.classList.remove('on');
      if (!down || !is3d) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 4) { moved = true; stopSpin(); mark('3d'); world.classList.add('drag'); turn = down.turn - dx * 0.25; apply(); }
    });
    const up = () => { if (down && !moved && !is3d) go3d(); down = null; if (!spin) world.classList.remove('drag'); };
    stage.addEventListener('pointerup', up);
    sec.querySelector('.m3-go').addEventListener('click', go3d);
    stage.addEventListener('pointerleave', () => { tip.classList.remove('on'); down = null; if (!spin) world.classList.remove('drag'); });

    size();
    window.addEventListener('resize', size);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
