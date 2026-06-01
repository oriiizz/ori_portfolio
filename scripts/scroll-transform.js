(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!reducedMotion.matches) {
    document.documentElement.classList.add("fx-smooth-scroll");
  }

  const floors = document.querySelectorAll(".fx-scroll-transform");
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

  const isEventCard = (element) =>
    element.classList.contains("event-card") && Boolean(element.closest(".events-page"));

  const updateEventCardFloor = (element) => {
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

  const updateFloor = (element) => {
    if (reducedMotion.matches) {
      element.style.transform = "";
      element.style.opacity = "";
      return;
    }

    if (isEventCard(element)) {
      updateEventCardFloor(element);
      return;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const stage = getStage(element);

    const scaleEnter = readNumber(element, "--fx-st-scale-enter", 1.06);
    const scaleExit = readNumber(element, "--fx-st-scale-exit", 0.92);
    const translateY = readNumber(element, "--fx-st-translate-y", 56);
    const rotateX = readNumber(element, "--fx-st-rotate-x", 4);
    const opacityMin = readNumber(element, "--fx-st-opacity-min", 0.62);
    const easeStrength = readNumber(element, "--fx-st-ease-strength", 1.15);
    const perspective = readNumber(
      stage || document.documentElement,
      "--fx-st-perspective",
      1400
    );

    const travel = viewportHeight + rect.height;
    const progress = clamp((viewportHeight - rect.top) / travel, 0, 1);
    const enterT = progress < 0.5 ? (0.5 - progress) / 0.5 : 0;
    const leaveT = progress > 0.5 ? (progress - 0.5) / 0.5 : 0;
    const easedEnter = Math.pow(enterT, easeStrength);
    const easedLeave = Math.pow(leaveT, easeStrength);

    const scale = 1 + (scaleEnter - 1) * easedEnter + (scaleExit - 1) * easedLeave;
    const y = translateY * easedEnter - translateY * 0.65 * easedLeave;
    const rotation = rotateX * easedEnter - rotateX * 0.45 * easedLeave;
    const opacity = 1 - (1 - opacityMin) * Math.max(easedEnter, easedLeave);

    element.style.transform =
      `perspective(${perspective}px) translate3d(0, ${y.toFixed(2)}px, 0) ` +
      `scale(${scale.toFixed(4)}) rotateX(${rotation.toFixed(2)}deg)`;
    element.style.opacity = opacity.toFixed(3);
  };

  let ticking = false;

  const updateAll = () => {
    floors.forEach(updateFloor);
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateAll);
    }
  };

  const resetFloors = () => {
    floors.forEach((element) => {
      element.style.transform = "";
      element.style.opacity = "";
    });
  };

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      resetFloors();
      return;
    }

    requestTick();
  });

  if (reducedMotion.matches) {
    resetFloors();
    return;
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
})();
