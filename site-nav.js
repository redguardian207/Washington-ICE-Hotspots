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

  var css = ""
    + "#sn-bar{position:fixed;top:0;left:0;bottom:0;width:220px;z-index:900;background:#fff;border-right:2px solid #e5e5e5;overflow-y:auto;padding:70px 10px 20px;box-sizing:border-box;font-family:'Source Sans 3',system-ui,sans-serif;transition:transform .25s ease}"
    + "#sn-bar h3{margin:0 8px 10px;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:#d10000}"
    + "#sn-bar a{display:block;padding:9px 12px;margin:2px 0;border-radius:10px;color:#000;text-decoration:none;font-weight:700;font-size:1rem;line-height:1.25}"
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
      html += '<a href="#' + it[0] + '">' + (L === "es" ? it[2] : it[1]) + "</a>";
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
