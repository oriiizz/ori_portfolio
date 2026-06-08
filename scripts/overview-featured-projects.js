(() => {
  /**
   * Overview featured projects — edit this list only when updating the 4 cards.
   * Paths are site-root relative (same as event-list.html).
   */
  const OVERVIEW_FEATURED_PROJECTS = [
    {
      slug: "the-silent-seconds-murder-case-z-cs-si-2024-001-y",
      title: "The Silent Seconds Murder Case Z-CS-SI-2024-001-Y",
      tags: ["Kinetic Installation", "Physical Computing"],
      cover: "cover.jpg",
    },
    {
      slug: "immersive-vr-experience-fragmented-echoes",
      title: "Fragmented Echoes",
      tags: ["VR", "Immersive Media"],
      cover: "cover.jpg",
    },
    {
      slug: "installation-design-the-disappearance-of-childhood",
      title: "The Disappearance of Childhood",
      tags: ["Art Installation", "Contemporary Art"],
      cover: "cover.jpg",
    },
    {
      slug: "bjfu-graduation-design-color-touchland",
      title: "Color Touchland",
      tags: ["Interactive Installation", "HCI", "Physical Computing"],
      cover: "cover.png",
    },
  ];

  const root = document.querySelector("[data-overview-featured]");
  if (!root) {
    return;
  }

  const projectHref = (slug) => `./${slug}.html`;
  const coverSrc = (slug, cover) => `./assets/projects/${slug}/${cover}`;

  const renderTags = (tags) => tags.map((tag) => `<span>${tag}</span>`).join("");

  root.innerHTML = OVERVIEW_FEATURED_PROJECTS.map((project) => {
    const href = projectHref(project.slug);
    const imageSrc = coverSrc(project.slug, project.cover);
    const tagsHtml = renderTags(project.tags);

    return `
      <article class="event-card" id="${project.slug}">
        <a
          class="event-card__media"
          href="${href}"
          aria-label="Open ${project.title}"
        >
          <img src="${imageSrc}" alt="${project.title}" />
        </a>
        <div class="event-card__content">
          <p class="project-tags">${tagsHtml}</p>
          <h2>
            <a href="${href}">${project.title}</a>
          </h2>
        </div>
      </article>
    `;
  }).join("");
})();
