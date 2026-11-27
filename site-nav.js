/* Left sidebar navigation, right-to-left support for Arabic and Farsi,
   and keeps the "Report a sighting" section at the bottom of the page. */
(function () {
  function lang() { try { var s = localStorage.getItem("site-lang"); return ["es", "ar", "fa"].indexOf(s) >= 0 ? s : "en"; } catch (e) { return "en"; } }
  var L = lang();
  var RTL = L === "ar" || L === "fa";

  var ITEMS = [
    ["top", "Home", "Inicio"],
    ["active", "Active sighting", "Avistamiento activo"],
    ["totals", "Totals", "Totales"],
    ["map3d", "Map", "Mapa"],
    ["schools", "High school students", "Estudiantes de preparatoria"],
    ["outlook", "Outlook", "Pronóstico"],
    ["patterns", "Patterns", "Patrones"],
    ["towns", "Towns", "Ciudades"],
    ["places", "Types of places", "Tipos de lugares"],
    ["weekdays", "Day and time", "Día y hora"],
    ["months", "By month", "Por mes"],
    ["list", "Every report", "Todos los reportes"],
    ["cameras", "Road cameras", "Cámaras de carretera"],
    ["locate", "Find someone detained", "Buscar a alguien detenido"],
    ["plates", "Your car and plates", "Tu auto y placas"],
    ["help", "Get help", "Pedir ayuda"],
    ["st-stories", "Stories", "Historias"],
    ["report", "Report a sighting", "Reportar un avistamiento"]
  ];

  // Simple line icons, one per menu item. They use currentColor, so they turn white on the active item.
  var P = {
    "top": '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    "active": '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    "totals": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "map3d": '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    "schools": '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
    "outlook": '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7z"/>',
    "patterns": '<path d="M3 17l5-6 4 4 8-9"/><path d="M15 6h5v5"/>',
    "towns": '<path d="M3 21V9l6-4v16"/><path d="M9 21V11l6-3v13"/><path d="M15 21v-8l6 2v6"/><path d="M2 21h20"/>',
    "places": '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    "weekdays": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "months": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "list": '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    "cameras": '<path d="M3 7h12v10H3z"/><path d="M15 10l6-3v10l-6-3"/>',
    "locate": '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    "plates": '<path d="M5 16l1.5-6h11L19 16"/><rect x="3" y="16" width="18" height="4" rx="1"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>',
    "help": '<path d="M4 18v-5a8 8 0 0 1 16 0v5"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/>',
    "st-stories": '<path d="M4 4h10l6 6v10H4z"/><path d="M14 4v6h6M8 14h8M8 17h5"/>',
    "report": '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>'
  };
  function icon(id) {
    return P[id] ? '<svg class="sn-ic" viewBox="0 0 24 24" aria-hidden="true">' + P[id] + "</svg>" : "";
  }

  var css = ""
    + "#sn-bar{position:fixed;top:0;left:0;bottom:0;width:220px;z-index:900;background:#fff;border-right:2px solid #e5e5e5;overflow-y:auto;padding:70px 10px 20px;box-sizing:border-box;font-family:'Source Sans 3',system-ui,sans-serif;transition:transform .25s ease}"
    + "#sn-bar h3{margin:0 8px 10px;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:#d10000}"
    + "#sn-bar a{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:2px 0;border-radius:10px;color:#000;text-decoration:none;font-weight:700;font-size:1rem;line-height:1.25}"
    + ".sn-ic{flex:0 0 22px;width:22px;height:22px;fill:none;stroke:#d10000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
    + "#sn-bar a.on .sn-ic{stroke:#fff}"
    + "#sn-bar a:hover,#sn-bar a:focus{background:#fdeaea;outline:none}"
    + "#sn-bar a.on{background:#d10000;color:#fff}"
    + "#sn-btn{display:none;position:fixed;top:14px;left:14px;z-index:1001;font:inherit;font-weight:700;font-size:15px;background:#d10000;color:#fff;border:0;border-radius:999px;padding:8px 14px;cursor:pointer}"
    + "@media (min-width:900px){body{padding-left:220px}}"
    + "@media (max-width:899px){#sn-btn{display:block}#sn-bar{transform:translateX(-100%);box-shadow:4px 0 20px rgba(0,0,0,.15)}#sn-bar.open{transform:none}}"
    + "#sn-report-wrap{padding-top:0}"
    + "html[dir=rtl] #sn-bar,html[dir=rtl] #sn-btn{direction:rtl}";

  function sectionsExist() {
    return ITEMS.filter(function (it) { var el = document.getElementById(it[0]); return el && !el.hidden; });
  }

  function moveReport() {
    var rep = document.getElementById("report");
    if (!rep) return;
    var wrap = document.getElementById("sn-report-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "sn-report-wrap";
      wrap.className = "site";
      wrap.innerHTML = '<div class="hs"></div>';
      var foot = document.querySelector("footer.site");
      if (foot) foot.parentNode.insertBefore(wrap, foot); else document.body.appendChild(wrap);
    }
    var inner = wrap.firstChild;
    if (rep.parentNode !== inner) inner.appendChild(rep);
    var foot2 = document.querySelector("footer.site");
    if (foot2 && wrap.nextElementSibling !== foot2) foot2.parentNode.insertBefore(wrap, foot2);
  }

  function build() {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    if (RTL) { document.documentElement.dir = "rtl"; document.documentElement.lang = L; }

    var bar = document.createElement("nav");
    bar.id = "sn-bar";
    bar.setAttribute("aria-label", "Site sections");
    var btn = document.createElement("button");
    btn.id = "sn-btn";
    btn.type = "button";
    btn.setAttribute("aria-controls", "sn-bar");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = L === "es" ? "☰ Menú" : "☰ Menu";
    document.body.appendChild(bar);
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      var open = bar.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    bar.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) { e.preventDefault(); reveal(el); history.replaceState(null, "", a.getAttribute("href")); }
      bar.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
    });

    render();
  }

  function render() {
    var bar = document.getElementById("sn-bar");
    if (!bar) return;
    var html = "<h3>" + (L === "es" ? "Secciones" : "Sections") + "</h3>";
    sectionsExist().forEach(function (it) {
      html += '<a href="#' + it[0] + '">' + icon(it[0]) + "<span>" + (L === "es" ? it[2] : it[1]) + "</span></a>";
    });
    if (bar.dataset.h === html) return;
    bar.dataset.h = html;
    bar.innerHTML = html;
    watch();
  }

  var obs;
  function watch() {
    if (!("IntersectionObserver" in window)) return;
    if (obs) obs.disconnect();
    obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        document.querySelectorAll("#sn-bar a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sectionsExist().forEach(function (it) { obs.observe(document.getElementById(it[0])); });
  }

  // For Arabic and Farsi, let Google Translate translate the widget sections too
  // (they are marked "notranslate" because they carry their own English/Spanish text).
  function allowTranslate() {
    if (!RTL) return;
    document.querySelectorAll("#st-stories, #st-stories .notranslate, #schools, .st-section").forEach(function (el) {
      el.classList.remove("notranslate");
      el.removeAttribute("translate");
    });
  }

  // Jump straight to a section, then fade the page in slowly, like the photos on the opening screen.
  function reveal(el) {
    var root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    el.scrollIntoView({ behavior: "instant", block: "start" });
    root.style.scrollBehavior = prev;
    if (el.classList.contains("mo-in")) el.classList.add("mo-show");
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    [].forEach.call(document.body.children, function (c) {
      if (c.id === "sn-bar" || c.id === "sn-btn" || !c.animate || c.tagName === "SCRIPT" || c.tagName === "STYLE") return;
      c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, easing: "ease-in-out" });
    });
  }

  function refresh() { moveReport(); allowTranslate(); render(); }

  function start() {
    build();
    refresh();
    // The stories and schools sections are added by other scripts; catch them when they appear.
    var n = 0, t = setInterval(function () { refresh(); if (++n > 10) clearInterval(t); }, 600);
    window.addEventListener("load", refresh);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
