/* Washington high schools section: school finder, rights, help line, and a reviewed message board by county.
   Posts are sent to Formspree and only show after the site owner adds them to school-board.json. */
(function () {
  var FORM = "https://formspree.io/f/maeoqrdp";
  var WIKI = "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_high_schools_in_Washington_(state)&prop=text&format=json&formatversion=2&origin=*";
  var CACHE = "wa-hs-v1";
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
        out.push({ n: name, c: city.trim(), k: c });
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

  function rowsHTML() {
    var q = query.toLowerCase();
    var list = schools.filter(function (s) {
      return (!county || s.k === county) && (!q || (s.n + " " + s.c + " " + s.k).toLowerCase().indexOf(q) >= 0);
    }).slice(0, 150);
    if (!list.length) return '<p>' + T("No schools match. Try another name or town.", "No hay escuelas con ese nombre. Prueba otro nombre o ciudad.") + "</p>";
    return '<ul class="sc-list">' + list.map(function (s) {
      var key = s.n + "|" + s.k, html = '<li><button class="sc-row" data-key="' + esc(key) + '" aria-expanded="' + (key === openKey) + '">'
        + '<span class="sc-av">' + esc(s.n.charAt(0)) + '</span><span><span class="sc-n">' + esc(s.n) + '</span><br><span class="sc-c">' + esc((s.c ? s.c + " · " : "") + s.k) + "</span></span></button></li>";
      if (key === openKey) html += "<li>" + openHTML(s) + "</li>";
      return html;
    }).join("") + "</ul>";
  }

  function openHTML(s) {
    var posts = board.filter(function (p) { return p.county === s.k; });
    return '<div class="sc-open"><h3>' + esc(s.n) + "</h3><div class=\"sc-c\">" + esc((s.c ? s.c + " · " : "") + s.k) + "</div>"
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
      if (row) { var k = row.getAttribute("data-key"); openKey = openKey === k ? "" : k; render(); }
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
