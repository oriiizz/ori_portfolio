(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!reducedMotion.matches) {
    document.documentElement.classList.add("fx-smooth-scroll");
  }

  document.querySelectorAll(".project-page .fx-scroll-transform").forEach((element) => {
    element.style.transform = "";
    element.style.opacity = "";
  });

  const floors = document.querySelectorAll(".events-page .event-card.fx-scroll-transform");
  if (!floors.length) {
    return;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const readNumber = (element, variable, fallback) => {
    const raw = getComputedStyle(element).getPropertyValue(variable).trim();
    if (!raw) {
      return fallback;
    }

    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getStage = (element) => element.closest(".fx-scroll-stage");

  const updateEventCardFloor = (element) => {
    if (element.classList.contains("is-filtered-out")) {
      element.style.transform = "";
      element.style.opacity = "";
      return;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const stage = getStage(element);

    const scalePeak = readNumber(element, "--fx-st-scale-enter", 1.05);
    const scaleMin = readNumber(element, "--fx-st-scale-exit", 0.94);
    const opacityMin = readNumber(element, "--fx-st-opacity-min", 0.68);
    const easeStrength = readNumber(element, "--fx-st-ease-strength", 1.15);
    const centerFalloff = readNumber(element, "--fx-st-center-falloff", 0.52);
    const perspective = readNumber(
      stage || document.documentElement,
      "--fx-st-perspective",
      1400
    );

    const cardCenter = rect.top + rect.height * 0.5;
    const viewportCenter = viewportHeight * 0.5;
    const distance = Math.abs(cardCenter - viewportCenter);
    const falloffDistance = Math.max(viewportHeight * centerFalloff, 1);
    const edgeT = clamp(distance / falloffDistance, 0, 1);
    const edgeEase = Math.pow(edgeT, easeStrength);

    const scale = scalePeak + (scaleMin - scalePeak) * edgeEase;
    const opacity = 1 - (1 - opacityMin) * edgeEase;

    element.style.transform =
      `perspective(${perspective}px) translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
    element.style.opacity = opacity.toFixed(3);
  };

  let ticking = false;

  const updateAll = () => {
    if (reducedMotion.matches) {
      floors.forEach((element) => {
        element.style.transform = "";
        element.style.opacity = "";
      });
      ticking = false;
      return;
    }

    floors.forEach(updateEventCardFloor);
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateAll);
    }
  };

  reducedMotion.addEventListener("change", () => {
    requestTick();
  });

  if (reducedMotion.matches) {
    floors.forEach((element) => {
      element.style.transform = "";
      element.style.opacity = "";
    });
    return;
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
})();
