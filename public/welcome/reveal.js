// Scroll reveal for the landing page. Shared by both languages.
// Sections fade and slide in once as they enter the viewport. Elements that
// are already on screen when the script runs are left alone so nothing
// flickers. The site's CSP blocks inline styles, so the stagger delay is set
// through the CSSOM, which CSP allows.
(function () {
  "use strict";

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const SELECTOR = [
    "#tour",
    ".sec .intro",
    ".sec .card",
    ".theme-grid > li",
    ".facts > div",
    ".faq",
    ".closing > *",
  ].join(",");

  const STAGGER_MS = 90;
  const MAX_STAGGER = 5;

  // Drop the reveal classes after the animation so the element's own
  // transitions (card hover lift, etc.) work as before.
  function cleanUp(el) {
    el.classList.remove("rv", "rv-on");
    el.style.transitionDelay = "";
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let order = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const el = entry.target;
        observer.unobserve(el);
        // Elements entering together appear one after another.
        el.style.transitionDelay =
          Math.min(order, MAX_STAGGER) * STAGGER_MS + "ms";
        order += 1;
        el.addEventListener("transitionend", function done(event) {
          if (event.target === el && event.propertyName === "opacity") {
            el.removeEventListener("transitionend", done);
            cleanUp(el);
          }
        });
        el.classList.add("rv-on");
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
  );

  const viewportBottom = window.innerHeight;
  document.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.getBoundingClientRect().top < viewportBottom) {
      return;
    }
    el.classList.add("rv");
    observer.observe(el);
  });
})();
