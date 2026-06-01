(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FADE_OUT_MS = 280;
  const FADE_IN_MS = 360;
  const NAVIGATE_OVERLAP_MS = 90;
  const STORAGE_KEY = "fx-page-transition";

  let leaving = false;
  const root = document.documentElement;

  const finishEnter = () => {
    if (reducedMotion.matches) {
      root.classList.remove("fx-page-enter-active", "fx-page-enter-from-nav");
      root.classList.add("fx-page-enter-ready");
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.add("fx-page-enter-ready");
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finishEnter, { once: true });
  } else {
    finishEnter();
  }

  const navigateWithFade = (href) => {
    if (leaving) {
      return;
    }

    if (reducedMotion.matches) {
      window.location.href = href;
      return;
    }

    leaving = true;

    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
      /* continue without persisted enter state */
    }

    root.classList.remove("fx-page-enter-ready");
    root.classList.add("fx-page-leaving");

    window.setTimeout(() => {
      window.location.href = href;
    }, Math.max(FADE_OUT_MS - NAVIGATE_OVERLAP_MS, 0));
  };

  const isSameDocumentHashLink = (url) =>
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    Boolean(url.hash);

  const shouldTransitionTo = (anchor) => {
    const rawHref = anchor.getAttribute("href");

    if (!rawHref || rawHref === "#" || rawHref.startsWith("#")) {
      return false;
    }

    if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
      return false;
    }

    let url;

    try {
      url = new URL(anchor.href);
    } catch {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (isSameDocumentHashLink(url)) {
      return false;
    }

    if (url.href === window.location.href) {
      return false;
    }

    return true;
  };

  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = event.target.closest("a[href]");
      if (!anchor || !shouldTransitionTo(anchor)) {
        return;
      }

      event.preventDefault();
      navigateWithFade(anchor.href);
    },
    true
  );

  const home = document.querySelector(".home");

  if (home) {
    const homeTarget = new URL("./event-list.html", window.location.href).href;

    home.addEventListener(
      "click",
      (event) => {
        if (event.target.closest("a[href]")) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        navigateWithFade(homeTarget);
      },
      true
    );

    home.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        navigateWithFade(homeTarget);
      },
      true
    );
  }

  window.addEventListener("pageshow", (event) => {
    leaving = false;
    root.classList.remove("fx-page-leaving");

    if (!event.persisted || reducedMotion.matches) {
      return;
    }

    root.classList.remove("fx-page-enter-ready");
    root.classList.add("fx-page-enter-active");
    finishEnter();
  });
})();
