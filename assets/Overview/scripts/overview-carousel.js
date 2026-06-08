(() => {
  const AUTOPLAY_MS = 3200;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const carousels = document.querySelectorAll("[data-overview-carousel]");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".overview-carousel__track");
    const originalSlides = Array.from(
      carousel.querySelectorAll(".overview-carousel__slide:not([data-carousel-clone])")
    );
    const prevButton = carousel.querySelector(".overview-carousel__btn--prev");
    const nextButton = carousel.querySelector(".overview-carousel__btn--next");
    const dots = Array.from(carousel.querySelectorAll(".overview-carousel__dot"));
    const autoplayEnabled = carousel.classList.contains("overview-carousel--photos");

    if (!track || originalSlides.length === 0) {
      return;
    }

    const totalReal = originalSlides.length;

    if (totalReal > 1) {
      const endClone = originalSlides[0].cloneNode(true);
      endClone.removeAttribute("id");
      endClone.classList.remove("is-active");
      endClone.setAttribute("aria-hidden", "true");
      endClone.dataset.carouselClone = "end";
      track.appendChild(endClone);
    }

    const slides = Array.from(carousel.querySelectorAll(".overview-carousel__slide"));
    let position = 0;
    let isTransitioning = false;
    let autoplayTimer = null;

    const realIndex = () => (position >= totalReal ? 0 : position);

    const applyTransform = (animate) => {
      if (!animate) {
        track.style.transition = "none";
      } else {
        track.style.transition = "";
      }

      track.style.transform = `translate3d(-${position * 100}%, 0, 0)`;

      const activeRealIndex = realIndex();
      originalSlides.forEach((slide, index) => {
        const isActive = index === activeRealIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach((dot, index) => {
        const isActive = index === activeRealIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      if (!animate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            track.style.transition = "";
          });
        });
      }
    };

    const goTo = (nextPosition, animate = true) => {
      if (isTransitioning && animate) {
        return;
      }

      if (animate) {
        isTransitioning = true;
      }

      position = nextPosition;
      applyTransform(animate);
    };

    const goNext = () => {
      if (totalReal <= 1) {
        return;
      }

      if (position >= totalReal) {
        return;
      }

      goTo(position + 1, true);
      resetAutoplay();
    };

    const goPrev = () => {
      if (totalReal <= 1) {
        return;
      }

      resetAutoplay();

      if (position === 0) {
        goTo(totalReal, false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            goTo(totalReal - 1, true);
          });
        });
        return;
      }

      goTo(position - 1, true);
    };

    const goToDot = (index) => {
      if (index < 0 || index >= totalReal || index === realIndex()) {
        return;
      }

      goTo(index, true);
      resetAutoplay();
    };

    track.addEventListener("transitionend", (event) => {
      if (event.target !== track || event.propertyName !== "transform") {
        return;
      }

      if (position === totalReal) {
        goTo(0, false);
      }

      isTransitioning = false;
    });

    const stopAutoplay = () => {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      if (!autoplayEnabled || totalReal <= 1 || reducedMotion.matches) {
        return;
      }

      stopAutoplay();
      autoplayTimer = window.setInterval(goNext, AUTOPLAY_MS);
    };

    const resetAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    prevButton?.addEventListener("click", goPrev);
    nextButton?.addEventListener("click", goNext);

    const clickViewport = carousel.querySelector("[data-overview-carousel-click]");
    if (autoplayEnabled && clickViewport) {
      clickViewport.addEventListener("click", (event) => {
        if (event.target.closest(".overview-carousel__dot")) {
          return;
        }

        const rect = clickViewport.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;

        if (offsetX < rect.width * 0.5) {
          goPrev();
        } else {
          goNext();
        }
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => goToDot(index));
    });

    let touchStartX = 0;
    let touchDeltaX = 0;

    carousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
        touchDeltaX = 0;
        stopAutoplay();
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchmove",
      (event) => {
        touchDeltaX = event.changedTouches[0].clientX - touchStartX;
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      () => {
        if (Math.abs(touchDeltaX) >= 40) {
          if (touchDeltaX < 0) {
            goNext();
          } else {
            goPrev();
          }
        }

        startAutoplay();
      },
      { passive: true }
    );

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        startAutoplay();
      }
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    applyTransform(false);
    startAutoplay();
  });
})();
