(() => {
  document.documentElement.classList.add("fx-smooth-scroll");

  const items = document.querySelectorAll(".fx-scale-reveal");

  if (!items.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-fx-in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-fx-in-view", entry.isIntersecting);
        entry.target.classList.toggle("is-fx-out-view", !entry.isIntersecting);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  items.forEach((item) => {
    item.classList.add("is-fx-out-view");
    observer.observe(item);
  });
})();
