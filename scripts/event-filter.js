(() => {
  const filterRoot = document.querySelector("[data-events-filter]");
  if (!filterRoot) {
    return;
  }

  const buttons = Array.from(filterRoot.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll(".events-list .event-card[data-project-filter]"));

  if (buttons.length === 0 || cards.length === 0) {
    return;
  }

  let activeFilter = "";

  const setActiveButton = (filter) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const applyFilter = (filter) => {
    activeFilter = filter;

    cards.forEach((card) => {
      const matches = !filter || card.dataset.projectFilter === filter;
      card.classList.toggle("is-filtered-out", !matches);
      card.setAttribute("aria-hidden", matches ? "false" : "true");
    });

    setActiveButton(filter);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextFilter =
        button.dataset.filter === activeFilter ? "" : button.dataset.filter;
      applyFilter(nextFilter);
    });
  });

  applyFilter("");
})();
