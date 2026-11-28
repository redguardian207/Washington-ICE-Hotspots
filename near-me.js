/* near-me.js: type an address, ZIP code or town (or tap "Use my location") and the site pulls up that area:
   how many reports are nearby, the closest towns, the latest reports, plus news, stories, student posts
   and social posts that mention those towns.
   Addresses are looked up with OpenStreetMap (Nominatim). Nothing is saved or sent to this site.
   Uses the town coordinates that map3d.js shares (window.WA_GEO); towns missing from that list get looked up once and remembered.
   Remove the <script src="near-me.js"> line in index.html to take it off. */
(() => {
  const L = () => { try { return localStorage.getItem('site-lang') || 'en'; } catch (e) { return 'en'; } };
  const TX = {
    title: { en: 'Reports near you', es: 'Reportes cerca de ti' },
    ph: { en: 'Enter your address, ZIP code or town', es: 'Escribe tu dirección, código postal o ciudad' },
    go: { en: 'Show my area', es: 'Ver mi zona' },
    me: { en: 'Use my location', es: 'Usar mi ubicación' },
    within: { en: 'Within', es: 'Dentro de' },
    mi: { en: 'miles', es: 'millas' },
    privacy: { en: 'Your address is not saved. It is only sent to OpenStreetMap to find the spot.', es: 'Tu dirección no se guarda. Solo se envía a OpenStreetMap para encontrar el lugar.' },
    looking: { en: 'Finding your area...', es: 'Buscando tu zona...' },
    notfound: { en: 'Could not find that address in Washington. Try adding the city or a ZIP code.', es: 'No encontramos esa dirección en Washington. Agrega la ciudad o el código postal.' },
    offline: { en: 'Could not look up the address. Check your connection and try again.', es: 'No se pudo buscar la dirección. Revisa tu conexión e intenta otra vez.' },
    nogeo: { en: 'Location is off or blocked. Type your address instead.', es: 'La ubicación está apagada o bloqueada. Escribe tu dirección.' },
    towns: { en: 'Towns near you (tap one to see its reports)', es: 'Ciudades cerca de ti (toca una para ver sus reportes)' },
    recent: { en: 'Latest reports near you', es: 'Reportes recientes cerca de ti' },
    news: { en: 'News about your area', es: 'Noticias de tu zona' },
    stories: { en: 'Stories from your area', es: 'Historias de tu zona' },
    board: { en: 'Student posts from your area', es: 'Publicaciones de estudiantes de tu zona' },
    social: { en: 'Posts about your area', es: 'Publicaciones sobre tu zona' }
  };
  const t = (k) => TX[k][L()] || TX[k].en;
  const countText = (n, r) => L() === 'es'
    ? n + (n === 1 ? ' reporte' : ' reportes') + ' a menos de ' + r + ' millas'
    : n + (n === 1 ? ' report' : ' reports') + ' within ' + r + ' miles';
  const noneText = (r, town, d) => L() === 'es'
    ? 'No hay reportes a menos de ' + r + ' millas. El más cercano: ' + town + ', a ' + d + ' millas.'
    : 'No reports within ' + r + ' miles. Closest: ' + town + ', ' + d + ' miles away.';

  // Look up a place inside Washington State only
  const BOX = '&countrycodes=us&viewbox=-124.85,49.05,-116.9,45.5&bounded=1';
  const geocode = (q) => fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1' + BOX + '&q=' + encodeURIComponent(q))
    .then((r) => r.json())
    .then((a) => {
      if (!a || !a[0]) return null;
      const p = [parseFloat(a[0].lat), parseFloat(a[0].lon)];
      const ad = a[0].address || {};
      p.names = [ad.city, ad.town, ad.village, ad.hamlet, ad.suburb, ad.county].filter(Boolean);
      return p;
    });

  const miles = (a, b) => {
    const R = 3958.8, rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  let DATA = null;
  const load = () => DATA || (DATA = fetch('data.json', { cache: 'no-store' }).then((r) => r.json())
    .then((d) => (Array.isArray(d) ? d : (d.incidents || []))).catch(() => { DATA = null; return []; }));

  // News, stories, student board and social posts: matched to the area by the town names they mention
  let EXTRA = null;
  const grab = (f) => fetch(f, { cache: 'no-store' }).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : (Object.values(d).find(Array.isArray) || []))).catch(() => []);
  const loadExtra = () => EXTRA || (EXTRA = Promise.all(['news.json', 'stories.json', 'school-board.json', 'social.json'].map(grab))
    .then(([news, stories, board, social]) => ({ news, stories, board, social })));
  const es = (x, k) => (L() === 'es' && x[k + '_es']) || x[k];

  // Town coordinates: from map3d.js, then any new towns looked up once (max 10 per search, OpenStreetMap asks for 1 per second)
  const townGeo = async (towns) => {
    const geo = Object.assign({}, window.WA_GEO || {});
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('near-geo') || '{}'); } catch (e) {}
    let asked = 0;
    for (const tn of towns) {
      if (geo[tn]) continue;
      if (cache[tn]) { geo[tn] = cache[tn]; continue; }
      if (asked++ >= 10) continue;
      try {
        await new Promise((r) => setTimeout(r, 1100));
        const p = await geocode(tn + ', Washington');
        if (p) geo[tn] = cache[tn] = p;
      } catch (e) {}
    }
    try { localStorage.setItem('near-geo', JSON.stringify(cache)); } catch (e) {}
    return geo;
  };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  const css = el('style');
  css.textContent =
    '.nm{margin:18px 0;padding:18px;border:3px solid #e0141e;border-radius:18px;background:#fff;color:#000}' +
    '.nm h2{margin:0 0 10px;font-size:1.6rem;color:#000}' +
    '.nm form{display:flex;flex-wrap:wrap;gap:10px;align-items:center}' +
    '.nm input{flex:1 1 260px;font-size:1.15rem;padding:12px 14px;border:2px solid #000;border-radius:12px;color:#000;background:#fff}' +
    '.nm select{font-size:1.05rem;padding:10px;border:2px solid #000;border-radius:12px;background:#fff;color:#000}' +
    '.nm button{font-size:1.05rem;font-weight:700;padding:12px 16px;border-radius:999px;border:2px solid #e0141e;cursor:pointer}' +
    '.nm .nm-go{background:#e0141e;color:#fff}.nm .nm-me{background:#fff;color:#e0141e}' +
    '.nm-note{font-size:.9rem;margin:8px 0 0;color:#000}' +
    '.nm-out{margin-top:14px}.nm-big{font-size:1.5rem;font-weight:800;color:#e0141e;margin:0 0 10px}' +
    '.nm-out h3{font-size:1.15rem;margin:14px 0 8px;color:#000}' +
    '.nm-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.nm-chip{background:#fff!important;color:#000!important;border:2px solid #000!important;font-weight:600!important}' +
    '.nm-chip b{color:#e0141e}' +
    '.nm-list{list-style:none;padding:0;margin:0}.nm-list li{padding:10px 0;border-top:1px solid #ddd;font-size:1.05rem}' +
    '.nm-list small{display:block;color:#000;opacity:.75}';
  document.head.appendChild(css);

  const mount = () => {
    const anchor = document.querySelector('.hs-gs');
    if (!anchor || document.querySelector('.nm')) return;
    const box = el('section', 'nm');
    box.id = 'near-me';
    const h = el('h2');
    const form = el('form');
    form.setAttribute('role', 'search');
    const inp = el('input');
    inp.type = 'search'; inp.autocomplete = 'street-address';
    const sel = el('select');
    [5, 10, 25, 50].forEach((n) => { const o = el('option', null, n); o.value = n; if (n === 10) o.selected = true; sel.appendChild(o); });
    const selLabel = el('label');
    const go = el('button', 'nm-go'); go.type = 'submit';
    const me = el('button', 'nm-me'); me.type = 'button';
    const note = el('p', 'nm-note');
    const out = el('div', 'nm-out');
    out.setAttribute('aria-live', 'polite');
    const selTxt = el('span'), selMi = el('span');
    selLabel.append(selTxt, ' ', sel, ' ', selMi);
    form.append(inp, selLabel, go, me);
    box.append(h, form, note, out);
    anchor.after(box);

    const label = () => {
      h.textContent = t('title'); inp.placeholder = t('ph'); inp.setAttribute('aria-label', t('ph'));
      go.textContent = t('go'); me.textContent = t('me'); selTxt.textContent = t('within'); selMi.textContent = t('mi');
      note.textContent = t('privacy');
    };
    label();
    new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    let last = null;
    const msg = (s) => { out.innerHTML = ''; out.appendChild(el('p', 'nm-big', s)); };

    const section = (title, items, draw) => {
      if (!items.length) return 0;
      out.appendChild(el('h3', null, title));
      const ul = el('ul', 'nm-list');
      items.slice(0, 6).forEach((x) => ul.appendChild(draw(x)));
      out.appendChild(ul);
      return items.length;
    };
    const item = (text, url, sub) => {
      const li = el('li');
      if (url) { const a = el('a', null, text); a.href = url; a.target = '_blank'; a.rel = 'noopener'; li.appendChild(a); }
      else li.appendChild(el('span', null, text));
      if (sub) li.appendChild(el('small', null, sub));
      return li;
    };

    const show = async (pt) => {
      last = pt;
      const r = +sel.value;
      const [rows, extra] = await Promise.all([load(), loadExtra()]);
      const towns = [...new Set(rows.map((x) => x.town).filter(Boolean).concat(Object.keys(window.WA_GEO || {})))];
      const geo = await townGeo(towns);
      const dist = {};
      towns.forEach((tn) => { if (geo[tn]) dist[tn] = miles(pt, geo[tn]); });
      const nearTowns = Object.keys(dist).filter((tn) => dist[tn] <= r);
      const names = nearTowns.concat(pt.names || []).map((n) => String(n).toLowerCase());
      const pats = names.map((n) => new RegExp('(^|[^a-z])' + n.replace(/[^a-z0-9 ]/g, '.') + '($|[^a-z])'));
      const hit = (...parts) => { const s = parts.filter(Boolean).join(' ').toLowerCase(); return pats.some((p) => p.test(s)); };
      const near = rows.filter((x) => dist[x.town] != null && dist[x.town] <= r);
      out.innerHTML = '';

      if (near.length) {
        out.appendChild(el('p', 'nm-big', countText(near.length, r)));
        // Closest towns first, with how far and how many reports
        const counts = {};
        near.forEach((x) => { counts[x.town] = (counts[x.town] || 0) + 1; });
        out.appendChild(el('h3', null, t('towns')));
        const chips = el('div', 'nm-chips');
        Object.keys(counts).sort((a, b) => dist[a] - dist[b]).forEach((tn) => {
          const b = el('button', 'nm-chip');
          b.type = 'button';
          b.append(tn + ' \u00b7 ' + Math.round(dist[tn]) + ' mi \u00b7 ');
          b.appendChild(el('b', null, counts[tn]));
          b.addEventListener('click', () => {
            const s = document.getElementById('hs-search');
            const list = document.getElementById('list');
            if (s) { s.value = tn; s.dispatchEvent(new Event('input', { bubbles: true })); }
            if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          chips.appendChild(b);
        });
        out.appendChild(chips);
        // Newest reports nearby
        section(t('recent'), near.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))), (x) =>
          item(x.title || x.place || x.town, x.url, [x.date, x.town, Math.round(dist[x.town]) + ' mi'].filter(Boolean).join(' \u00b7 ')));
      } else {
        const withReports = Object.keys(dist).filter((tn) => rows.some((x) => x.town === tn)).sort((a, b) => dist[a] - dist[b]);
        out.appendChild(el('p', 'nm-big', withReports[0] ? noneText(r, withReports[0], Math.round(dist[withReports[0]])) : t('notfound')));
      }

      // Everything else on the site that mentions a nearby town
      const byDate = (a, b) => String(b.date || b.photoDate || '').localeCompare(String(a.date || a.photoDate || ''));
      section(t('news'), extra.news.filter((x) => hit(x.title, x.summary, x.summary_es)).sort(byDate), (x) =>
        item(x.title, x.url, [x.outlet, es(x, 'date')].filter(Boolean).join(' \u00b7 ')));
      section(t('stories'), extra.stories.filter((x) => x.approved !== false && hit(x.area, x.area_es, x.summary)), (x) =>
        item((x.name ? x.name + ': ' : '') + (es(x, 'summary') || ''), null, es(x, 'area')));
      section(t('board'), extra.board.filter((x) => x.approved !== false && hit(x.area, x.town, x.text, x.message, x.body)).sort(byDate), (x) =>
        item(x.text || x.message || x.body || x.title || '', null, [x.area || x.town, x.date].filter(Boolean).join(' \u00b7 ')));
      section(t('social'), extra.social.filter((x) => hit(x.title, x.text, x.summary, x.area, x.town)).sort(byDate), (x) =>
        item(x.title || x.text || x.summary || '', x.url, [x.source || x.outlet, x.date].filter(Boolean).join(' \u00b7 ')));
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = inp.value.trim();
      if (!q) return;
      msg(t('looking'));
      geocode(q).then((p) => (p ? show(p) : msg(t('notfound')))).catch(() => msg(t('offline')));
    });
    me.addEventListener('click', () => {
      if (!navigator.geolocation) { msg(t('nogeo')); return; }
      msg(t('looking'));
      navigator.geolocation.getCurrentPosition((p) => show([p.coords.latitude, p.coords.longitude]), () => msg(t('nogeo')), { timeout: 10000, maximumAge: 300000 });
    });
    sel.addEventListener('change', () => { if (last) show(last); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
