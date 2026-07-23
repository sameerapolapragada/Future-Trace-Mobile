(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var header = document.getElementById("site-header");
  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // App Store URL: set window.APP_STORE_URL in /config.js when the listing is live.
  var storeUrl = typeof window.APP_STORE_URL === "string" ? window.APP_STORE_URL.trim() : "#";
  var links = document.querySelectorAll(".app-store-link");
  links.forEach(function (el) {
    if (storeUrl && storeUrl !== "#") {
      el.setAttribute("href", storeUrl);
      el.setAttribute("rel", "noopener noreferrer");
      el.setAttribute("target", "_blank");
    } else {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        window.alert(
          "The App Store listing link will be added here when Future Trace is live. For help, email support@futuretrace.ai."
        );
      });
    }
  });
})();
