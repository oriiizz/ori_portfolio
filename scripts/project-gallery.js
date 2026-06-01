(() => {
  const galleries = document.querySelectorAll(".project-detail-gallery[data-project]");
  const extensions = ["jpg", "png", "jpeg", "webp"];
  const maxImages = 60;

  const padIndex = (index) => String(index).padStart(2, "0");

  const loadImage = (src, alt) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
      image.alt = alt;
    });

  const findImage = async (project, index, altBase) => {
    const imageNumber = padIndex(index);

    for (const extension of extensions) {
      const src = `./assets/projects/${project}/detail_${imageNumber}.${extension}`;
      const image = await loadImage(src, `${altBase} ${index}`);

      if (image) {
        return image;
      }
    }

    return null;
  };

  const renderGallery = async (gallery) => {
    const project = gallery.dataset.project;
    const altBase = gallery.dataset.alt || "Project detail image";
    const startIndex = Number(gallery.dataset.start || 1);
    const endIndex = Number(gallery.dataset.end || maxImages);

    for (let index = startIndex; index <= endIndex; index += 1) {
      const image = await findImage(project, index, altBase);

      if (!image) {
        break;
      }

      const figure = document.createElement("figure");
      figure.className = "project-detail-image";
      figure.append(image);
      gallery.append(figure);
    }
  };

  galleries.forEach((gallery) => {
    renderGallery(gallery);
  });
})();
