(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

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
