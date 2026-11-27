/* Washington high schools section: school finder, rights, help line, and a reviewed message board by county.
   Posts are sent to Formspree and only show after the site owner adds them to school-board.json. */
(function () {
  var FORM = "https://formspree.io/f/maeoqrdp";
  var WIKI = "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_high_schools_in_Washington_(state)&prop=text&format=json&formatversion=2&origin=*";
  var CACHE = "wa-hs-v2", LOOKS = "wa-hs-looks-v1";
  var NOT_PUBLIC = /christian|catholic|adventist|lutheran|baptist|jesuit|seminary|holy names|bishop|saint |st\. |bible|islamic|jewish|waldorf|montessori|juvenile|detention|correction|justice center|overlake|annie wright|charles wright|bush school|lakeside school|northwest school|forest ridge|bellarmine|o'dea|gonzaga|archbishop|seattle academy|university prep|eastside prep|tri-cities prep|dartmoor|king's|cristo rey|private/i;
  var RED = "#e0141e";

  function lang() { try { return localStorage.getItem("site-lang") === "es" ? "es" : "en"; } catch (e) { return "en"; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function T(en, es) { return '<span class="st-i" data-en="' + esc(en) + '" data-es="' + esc(es) + '">' + esc(lang() === "es" ? es : en) + "</span>"; }
  function t(en, es) { return lang() === "es" ? es : en; }

  var WHO = [["me", "Me", "Yo"], ["parent", "My parent", "Mi mamá o papá"], ["sibling", "My brother or sister", "Mi hermano o hermana"], ["relative", "Another relative", "Otro familiar"], ["friend", "A friend", "Un amigo o amiga"], ["other", "Someone else", "Otra persona"]];
  function whoLabel(k) { for (var i = 0; i < WHO.length; i++) if (WHO[i][0] === k) return t(WHO[i][1], WHO[i][2]); return ""; }

  var css = ""
    + "#schools .sc-search{width:100%;box-sizing:border-box;font:inherit;font-size:1.1rem;padding:12px 16px;border:2px solid #dbdbdb;border-radius:999px;background:#fafafa;color:#000;margin:6px 0 12px}"
    + "#schools .sc-search:focus{outline:none;border-color:" + RED + "}"
    + "#schools .sc-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:8px}"
    + "#schools .sc-chip{flex:none;font:inherit;font-size:.95rem;font-weight:700;border:2px solid " + RED + ";border-radius:999px;padding:6px 14px;background:#fff;color:#000;cursor:pointer;white-space:nowrap}"
    + "#schools .sc-chip[aria-pressed=true]{background:" + RED + ";color:#fff}"
    + "#schools .sc-list{list-style:none;margin:0;padding:0;max-height:420px;overflow-y:auto}"
    + "#schools .sc-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;background:#fff;border:0;border-bottom:1px solid #efefef;padding:10px 4px;cursor:pointer;color:#000}"
    + "#schools .sc-row:hover{background:#fff6f6}"
    + "#schools .sc-row[data-look] .sc-av{background:var(--s1);color:var(--s1t);box-shadow:inset 0 0 0 3px var(--s2),0 0 0 2px var(--s1)}"
    + "#schools .sc-open[data-look]{border-color:var(--s1);background:linear-gradient(180deg,color-mix(in srgb,var(--s1) 14%,#fff),#fff 160px)}"
    + "#schools .sc-open[data-look] .sc-box{background:color-mix(in srgb,var(--s1) 9%,#fff)}"
    + "#schools .sc-open[data-look] .sc-box b,#schools .sc-open[data-look] .sc-who{color:var(--s1d)}"
    + "#schools .sc-open[data-look] .sc-call,#schools .sc-open[data-look] .sc-send{background:var(--s1);color:var(--s1t)!important;box-shadow:0 0 0 3px var(--s2)}"
    + "#schools .sc-emb{float:right;width:92px;height:104px;margin:0 0 8px 12px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.2));animation:scEmb .6s cubic-bezier(.2,.8,.2,1)}"
    + "@keyframes scEmb{from{transform:scale(.6) rotate(-8deg);opacity:0}}"
    + "#schools .sc-mascot{display:inline-block;margin-top:8px;font-weight:800;color:var(--s1t);background:var(--s1);border:2px solid var(--s2);border-radius:999px;padding:4px 12px}"
    + "#schools .sc-cols{display:flex;gap:6px;margin-top:8px}#schools .sc-cols i{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #ccc}"
    + "#schools .sc-av{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;background:" + RED + ";box-shadow:inset 0 0 0 3px #fff,0 0 0 2px " + RED + "}"
    + "#schools .sc-n{font-weight:700;font-size:1.05rem}#schools .sc-c{font-size:.9rem;color:#444}"
    + "#schools .sc-open{border:2px solid " + RED + ";border-radius:18px;padding:16px;margin:12px 0;background:#fff;animation:scIn .25s ease}"
    + "@keyframes scIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}"
    + "@media (prefers-reduced-motion:reduce){#schools .sc-open{animation:none}}"
    + "#schools .sc-open h3{margin:0 0 4px;font-size:1.35rem;font-weight:800}"
    + "#schools .sc-box{background:#fff4f4;border-radius:14px;padding:12px 14px;margin:12px 0}"
    + "#schools .sc-box b{color:" + RED + "}#schools .sc-box ul{margin:6px 0 0;padding-left:20px}"
    + "#schools .sc-call{display:inline-block;margin-top:8px;background:" + RED + ";color:#fff!important;font-weight:800;text-decoration:none;border-radius:999px;padding:10px 18px}"
    + "#schools .sc-post{border:1px solid #dbdbdb;border-radius:14px;padding:12px 14px;margin:8px 0;background:#fff}"
    + "#schools .sc-post .sc-who{font-weight:800;color:" + RED + ";font-size:.9rem}"
    + "#schools textarea,#schools select{width:100%;box-sizing:border-box;font:inherit;font-size:1rem;border:2px solid #dbdbdb;border-radius:14px;padding:10px 12px;background:#fff;color:#000;margin:6px 0}"
    + "#schools textarea{min-height:110px}#schools label.sc-ok{display:flex;gap:8px;align-items:flex-start;font-size:.95rem;margin:6px 0}"
    + "#schools .sc-send{font:inherit;font-weight:800;font-size:1rem;border:0;border-radius:999px;padding:10px 20px;background:" + RED + ";color:#fff;cursor:pointer}"
    + "#schools .sc-send:disabled{opacity:.5;cursor:default}"
    + "#schools .sc-msg{font-weight:700;margin-top:8px}";

  var schools = [], counties = [], board = [], county = "", query = "", openKey = "";

  function parse(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var root = doc.querySelector(".mw-parser-output") || doc.body;
    var out = [], c = "", h3 = "", priv = false, seen = {};
    var tw = doc.createTreeWalker(root, 1), n;
    while ((n = tw.nextNode())) {
      var tag = n.tagName;
      if (tag === "H2") { c = n.textContent.trim(); h3 = ""; priv = false; }
      else if (tag === "H3") { h3 = n.textContent.trim(); priv = /private/i.test(h3); }
      else if (tag === "H4") { priv = /private/i.test(n.textContent); }
      else if (tag === "LI" && /County$/.test(c) && !priv && !n.closest(".navbox,.reflist,.references,.toc")) {
        var txt = "";
        n.childNodes.forEach(function (x) { if (x.nodeName !== "UL" && x.nodeName !== "SUP") txt += x.textContent; });
        txt = txt.replace(/\[\d+\]/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
        if (!txt || NOT_PUBLIC.test(txt)) continue;
        var i = txt.indexOf(", "), name = i > 0 ? txt.slice(0, i) : txt, city = i > 0 ? txt.slice(i + 2) : h3;
        var key = name + "|" + c;
        if (seen[key]) continue; seen[key] = 1;
        var a = n.querySelector("a[href^='/wiki/']");
        out.push({ n: name, c: city.trim(), k: c, w: a ? (a.getAttribute("title") || "") : "" });
      }
    }
    return out;
  }

  function loadSchools() {
    try {
      var hit = JSON.parse(localStorage.getItem(CACHE) || "null");
      if (hit && hit.at > Date.now() - 7 * 864e5 && hit.list.length) return Promise.resolve(hit.list);
    } catch (e) {}
    return fetch(WIKI).then(function (r) { return r.json(); }).then(function (j) {
      var list = parse(j.parse.text);
      try { localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), list: list })); } catch (e) {}
      return list;
    });
  }

  function loadBoard() {
    return fetch("school-board.json?x=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }

  // School colors and mascot, read from each school's Wikipedia infobox and cached for 30 days.
  var looks = {}, want = {}, asked = {}, timer = 0;
  try { var lc = JSON.parse(localStorage.getItem(LOOKS) || "null"); if (lc && lc.at > Date.now() - 30 * 864e5) looks = lc.v || {}; } catch (e) {}
  var NAMED = { "old gold": "#cfb53b", "vegas gold": "#c5b358", "athletic gold": "#ffb81c", "metallic gold": "#d4af37", "kelly green": "#4cbb17", "forest green": "#228b22", "hunter green": "#355e3b", "dark green": "#00563f", "royal blue": "#2251c4", "navy blue": "#14295b", "columbia blue": "#9bcbeb", "carolina blue": "#7bafd4", "light blue": "#6cace4", "sky blue": "#62b5e5", "powder blue": "#9bc4e2", "dark blue": "#1f2a5c", "cardinal red": "#c41e3a", "scarlet": "#d21f3c", "crimson": "#a6192e", "cardinal": "#c41e3a", "maroon": "#7a1f2b", "burgundy": "#800020", "garnet": "#7b1e2e", "red": "#c8102e", "orange": "#ff7f1f", "gold": "#ffc72c", "yellow": "#ffd100", "green": "#00843d", "teal": "#00838f", "turquoise": "#30b0b5", "blue": "#0b4ea2", "navy": "#14295b", "purple": "#582c83", "violet": "#6d3fa0", "black": "#111111", "white": "#ffffff", "silver": "#a7a8aa", "gray": "#7a7d80", "grey": "#7a7d80", "brown": "#6b3e26", "cream": "#f3e5c0", "emerald": "#00915a", "pink": "#e75480", "copper": "#b87333", "bronze": "#a97142", "tan": "#c9a66b" };
  var NAMES = Object.keys(NAMED).sort(function (a, b) { return b.length - a.length; });
  function clean(v) {
    return v.replace(/<ref[^>]*\/>/g, "").replace(/<ref[\s\S]*?<\/ref>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ")
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1").replace(/\{\{[^{}]*\}\}/g, " ").replace(/'{2,}/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }
  function field(txt, names) {
    var m = txt.match(new RegExp("\\n\\s*\\|\\s*(?:" + names + ")\\s*=[ \\t]*([\\s\\S]*?)(?=\\n\\s*\\||\\n\\s*\\}\\})", "i"));
    return m ? m[1].trim() : "";
  }
  function colorsOf(raw) {
    raw = raw.replace(/\{\{\s*colou?r ?box\s*\|\s*([^|}]+)[^}]*\}\}/gi, " $1 ");
    var out = [], m, re = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
    while ((m = re.exec(raw)) && out.length < 3) out.push("#" + m[1].toLowerCase());
    if (out.length >= 2) return out;
    var words = " " + clean(raw).toLowerCase() + " ", hits = [];
    NAMES.forEach(function (k) {
      var re2 = new RegExp("[^a-z]" + k + "(?=[^a-z])"), mm;
      while ((mm = re2.exec(words))) { hits.push([mm.index, NAMED[k]]); words = words.slice(0, mm.index + 1) + " ".repeat(k.length) + words.slice(mm.index + 1 + k.length); }
    });
    hits.sort(function (a, b) { return a[0] - b[0]; });
    return out.concat(hits.map(function (h) { return h[1]; })).slice(0, 3);
  }
  function lum(h) {
    h = h.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function lookOf(txt) {
    var cols = colorsOf(field(txt, "colou?rs|school_colou?rs|colou?r")).filter(function (c, i, a) { return a.indexOf(c) === i; });
    // Lead with a strong color; white or very light ones go second.
    cols.sort(function (a, b) { return (lum(a) > .8) - (lum(b) > .8); });
    var mascot = clean(field(txt, "mascot|nickname|team_name|athletics_nickname")).replace(/^the\s+/i, "").split(/[,;(]| and /)[0].trim();
    if (mascot.length > 40) mascot = "";
    if (!cols.length && !mascot) return null;
    return { c: cols, m: mascot };
  }
  function lookStyle(lk) {
    if (!lk || !lk.c || !lk.c.length) return "";
    var a = lk.c[0], b = lk.c[1] || "#ffffff", light = lum(a) > .45;
    return ' data-look="1" style="--s1:' + a + ";--s2:" + b + ";--s1t:" + (light ? "#000" : "#fff") + ";--s1d:" + (light ? "#333" : a) + '"';
  }
  function emblem(s, lk) {
    if (!lk || !lk.c || !lk.c.length) return "";
    var a = lk.c[0], b = lk.c[1] || "#ffffff", fg = lum(a) > .45 ? "#111" : "#fff";
    var ch = esc((lk.m || s.n).charAt(0).toUpperCase());
    return '<svg class="sc-emb" viewBox="0 0 92 104" aria-hidden="true"><path d="M46 3 L87 16 V50 C87 76 68 93 46 101 C24 93 5 76 5 50 V16 Z" fill="' + b + '" stroke="' + a + '" stroke-width="4"/>'
      + '<path d="M46 13 L78 23 V50 C78 70 64 84 46 91 C28 84 14 70 14 50 V23 Z" fill="' + a + '"/>'
      + '<text x="46" y="64" text-anchor="middle" font-size="40" font-weight="900" font-family="Georgia,serif" fill="' + fg + '" stroke="' + b + '" stroke-width="1.2">' + ch + "</text></svg>";
  }
  function saveLooks() { try { localStorage.setItem(LOOKS, JSON.stringify({ at: Date.now(), v: looks })); } catch (e) {} }
  function fetchLooks() {
    timer = 0;
    var titles = Object.keys(want).slice(0, 20);
    titles.forEach(function (t) { delete want[t]; asked[t] = 1; });
    if (!titles.length) return;
    var url = "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&formatversion=2&origin=*&titles=" + encodeURIComponent(titles.join("|"));
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var q = j.query || {}, back = {};
      (q.normalized || []).concat(q.redirects || []).forEach(function (x) { back[x.to] = (back[x.to] || []).concat(back[x.from] || [x.from]); });
      (q.pages || []).forEach(function (p) {
        var txt = p.revisions && p.revisions[0] && p.revisions[0].slots && p.revisions[0].slots.main.content;
        var lk = txt ? lookOf(txt) : null;
        [p.title].concat(back[p.title] || []).forEach(function (t) { looks[t] = lk || 0; });
      });
      titles.forEach(function (t) { if (!(t in looks)) looks[t] = 0; });
      saveLooks(); paint();
    }).catch(function () {}).then(function () { if (Object.keys(want).length && !timer) timer = setTimeout(fetchLooks, 200); });
  }
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var w = e.isIntersecting && e.target.getAttribute("data-w");
      if (w && !(w in looks) && !asked[w]) { want[w] = 1; if (!timer) timer = setTimeout(fetchLooks, 250); }
    });
  }, { rootMargin: "300px" }) : null;
  function watchRows(box) {
    if (!io) return;
    io.disconnect();
    box.querySelectorAll(".sc-row[data-w]").forEach(function (r) { if (r.getAttribute("data-w")) io.observe(r); });
  }
  // Fill in colors without rebuilding the list, so the search box and the open school stay as they are.
  function paint() {
    var box = document.getElementById("sc-body"); if (!box) return;
    var needOpen = false;
    box.querySelectorAll(".sc-row[data-w]").forEach(function (r) {
      var lk = looks[r.getAttribute("data-w")];
      if (!lk || r.hasAttribute("data-look")) return;
      var m = lookStyle(lk).match(/style="([^"]*)"/); if (!m) return;
      r.setAttribute("data-look", "1"); r.setAttribute("style", m[1]);
      if (r.getAttribute("aria-expanded") === "true") needOpen = true;
    });
    if (needOpen) { var y = window.scrollY; render(); window.scrollTo(0, y); }
  }

  function rowsHTML() {
    var q = query.toLowerCase();
    var list = schools.filter(function (s) {
      return (!county || s.k === county) && (!q || (s.n + " " + s.c + " " + s.k).toLowerCase().indexOf(q) >= 0);
    }).slice(0, 150);
    if (!list.length) return '<p>' + T("No schools match. Try another name or town.", "No hay escuelas con ese nombre. Prueba otro nombre o ciudad.") + "</p>";
    return '<ul class="sc-list">' + list.map(function (s) {
      var key = s.n + "|" + s.k, html = '<li><button class="sc-row" data-key="' + esc(key) + '" data-w="' + esc(s.w || "") + '" aria-expanded="' + (key === openKey) + '"' + lookStyle(looks[s.w]) + '>'
        + '<span class="sc-av">' + esc(s.n.charAt(0)) + '</span><span><span class="sc-n">' + esc(s.n) + '</span><br><span class="sc-c">' + esc((s.c ? s.c + " · " : "") + s.k) + "</span></span></button></li>";
      if (key === openKey) html += "<li>" + openHTML(s) + "</li>";
      return html;
    }).join("") + "</ul>";
  }

  function openHTML(s) {
    var posts = board.filter(function (p) { return p.county === s.k; });
    var lk = looks[s.w];
    return '<div class="sc-open"' + lookStyle(lk) + ">" + emblem(s, lk) + "<h3>" + esc(s.n) + "</h3><div class=\"sc-c\">" + esc((s.c ? s.c + " · " : "") + s.k) + "</div>"
      + (lk && lk.m ? '<div class="sc-mascot">' + T("Home of the ", "Hogar de los ") + esc(lk.m) + "</div>" : "")
      + (lk && lk.c && lk.c.length ? '<div class="sc-cols">' + lk.c.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + "</div>" : "")
      + '<div class="sc-box"><b>' + T("Your rights at school", "Tus derechos en la escuela") + "</b><ul>"
      + "<li>" + T("Every kid in Washington can go to public school, no matter their or their family's immigration status.", "Todo niño en Washington puede ir a la escuela pública, sin importar su estatus migratorio o el de su familia.") + "</li>"
      + "<li>" + T("Your school can't deny you enrollment because of immigration status, and it can't reach out to immigration agents to share your information.", "Tu escuela no puede negarte la inscripción por tu estatus migratorio, ni puede contactar a agentes de inmigración para compartir tu información.") + "</li>"
      + "<li>" + T("Schools must have a plan for when immigration agents come to campus. Ask your counselor about it.", "Las escuelas deben tener un plan para cuando lleguen agentes de inmigración. Pregúntale a tu consejero.") + "</li>"
      + '</ul><a href="https://ospi.k12.wa.us/policy-funding/equity-and-civil-rights/immigrant-student%E2%80%99s-rights-attend-public-schools" target="_blank" rel="noopener">' + T("Read the state guide (OSPI)", "Lee la guía del estado (OSPI)") + "</a></div>"
      + '<div class="sc-box"><b>' + T("Need help now?", "¿Necesitas ayuda ahora?") + "</b><br>" + T("Call the Washington Immigrant Solidarity Network hotline to report ICE activity or get help for your family.", "Llama a la línea de la Red de Solidaridad con Inmigrantes de Washington para reportar actividad de ICE u obtener ayuda para tu familia.")
      + '<br><a class="sc-call" href="tel:18447243737">1-844-724-3737</a></div>'
      + "<h4>" + T("Student board: ", "Muro de estudiantes: ") + esc(s.k) + "</h4>"
      + "<p class=\"sc-c\">" + T("Posts are grouped by county, not by school, so no one can trace them back to you. Every post is checked before it shows.", "Las publicaciones se agrupan por condado, no por escuela, para que nadie pueda saber que eres tú. Cada publicación se revisa antes de aparecer.") + "</p>"
      + (posts.length ? posts.map(function (p) {
          return '<div class="sc-post"><div class="sc-who">' + esc(whoLabel(p.who)) + "</div>" + esc(p.text) + "</div>";
        }).join("") : "<p>" + T("No posts here yet.", "Todavía no hay publicaciones aquí.") + "</p>")
      + formHTML(s) + "</div>";
  }

  function formHTML(s) {
    return '<form class="sc-form" data-county="' + esc(s.k) + '"><b>' + T("Share what happened", "Cuenta lo que pasó") + "</b>"
      + '<select name="who" required><option value="">' + esc(t("Who was affected?", "¿A quién le afectó?")) + "</option>"
      + WHO.map(function (w) { return '<option value="' + w[0] + '">' + esc(t(w[1], w[2])) + "</option>"; }).join("") + "</select>"
      + '<textarea name="text" maxlength="1000" required placeholder="' + esc(t("How were you or your family affected? How are you doing?", "¿Cómo te afectó a ti o a tu familia? ¿Cómo estás?")) + '"></textarea>'
      + '<label class="sc-ok"><input type="checkbox" name="ok" required> <span>' + T("I didn't include any names, addresses, phone numbers, or the name of my school.", "No incluí nombres, direcciones, teléfonos ni el nombre de mi escuela.") + "</span></label>"
      + '<button class="sc-send" type="submit">' + T("Send for review", "Enviar para revisión") + '</button><div class="sc-msg" role="status"></div></form>';
  }

  function render() {
    var box = document.getElementById("sc-body");
    if (!box) return;
    box.innerHTML = rowsHTML();
    watchRows(box);
  }

  function chips() {
    var el = document.getElementById("sc-chips");
    el.innerHTML = ['<button class="sc-chip" data-c="" aria-pressed="' + (!county) + '">' + esc(t("All", "Todos")) + "</button>"].concat(counties.map(function (c) {
      return '<button class="sc-chip" data-c="' + esc(c) + '" aria-pressed="' + (c === county) + '">' + esc(c.replace(/ County$/, "")) + "</button>";
    })).join("");
  }

  function build() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    var sec = document.createElement("section");
    sec.id = "schools";
    sec.className = "hs-card";
    sec.innerHTML = "<h2><strong>" + T("High school students", "Estudiantes de preparatoria") + "</strong></h2>"
      + "<p><strong>" + T("Find your school to see your rights, get help, and read or share how ICE has affected students and families in your county.", "Busca tu escuela para ver tus derechos, pedir ayuda y leer o contar cómo ICE ha afectado a estudiantes y familias en tu condado.") + "</strong></p>"
      + '<input class="sc-search" id="sc-q" type="search" autocomplete="off">'
      + '<div class="sc-chips" id="sc-chips"></div><div id="sc-body"><p>' + T("Loading schools…", "Cargando escuelas…") + "</p></div>"
      + '<p class="sc-c">' + T("School list from Wikipedia's list of Washington high schools.", "Lista de escuelas de la lista de preparatorias de Washington en Wikipedia.") + "</p>";
    var after = document.getElementById("totals") || document.getElementById("active");
    if (after && after.parentNode) after.parentNode.insertBefore(sec, after.nextSibling);
    else (document.querySelector(".hs") || document.body).appendChild(sec);

    var q = document.getElementById("sc-q");
    q.placeholder = t("Search your school or town", "Busca tu escuela o ciudad");
    q.addEventListener("input", function () { query = q.value; openKey = ""; render(); });

    sec.addEventListener("click", function (e) {
      var chip = e.target.closest(".sc-chip");
      if (chip) { county = chip.getAttribute("data-c"); openKey = ""; chips(); render(); return; }
      var row = e.target.closest(".sc-row");
      if (row) {
        var k = row.getAttribute("data-key"), w = row.getAttribute("data-w"); openKey = openKey === k ? "" : k;
        if (w && !(w in looks) && !asked[w]) { want[w] = 1; clearTimeout(timer); timer = setTimeout(fetchLooks, 0); }
        render();
      }
    });

    sec.addEventListener("submit", function (e) {
      var f = e.target.closest(".sc-form");
      if (!f) return;
      e.preventDefault();
      var btn = f.querySelector(".sc-send"), msg = f.querySelector(".sc-msg");
      btn.disabled = true;
      var data = new FormData();
      data.append("_subject", "Student board post: " + f.getAttribute("data-county"));
      data.append("type", "school-board");
      data.append("county", f.getAttribute("data-county"));
      data.append("who", f.who.value);
      data.append("text", f.text.value);
      data.append("lang", lang());
      fetch(FORM, { method: "POST", body: data, headers: { Accept: "application/json" } }).then(function (r) {
        if (!r.ok) throw 0;
        f.reset();
        msg.textContent = t("Thanks. Your post will show here after it's reviewed.", "Gracias. Tu publicación aparecerá aquí después de ser revisada.");
      }).catch(function () {
        msg.textContent = t("That didn't send. Check your connection and try again.", "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.");
      }).then(function () { btn.disabled = false; });
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest(".st-lang")) setTimeout(function () { q.placeholder = t("Search your school or town", "Busca tu escuela o ciudad"); chips(); render(); }, 50);
    });

    Promise.all([loadSchools(), loadBoard()]).then(function (r) {
      schools = r[0]; board = Array.isArray(r[1]) ? r[1] : [];
      var seen = {};
      schools.forEach(function (s) { seen[s.k] = 1; });
      counties = Object.keys(seen).sort();
      chips(); render();
    }).catch(function () {
      document.getElementById("sc-body").innerHTML = "<p>" + T("Couldn't load the school list. Refresh to try again.", "No se pudo cargar la lista de escuelas. Recarga la página.") + "</p>";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
