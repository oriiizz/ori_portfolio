(function (doc, storage) {
  doc.documentElement.classList.add("fx-page-enter-active");

  try {
    if (storage.getItem("fx-page-transition") === "1") {
      doc.documentElement.classList.add("fx-page-enter-from-nav");
      storage.removeItem("fx-page-transition");
    }
  } catch (error) {
    /* ignore private mode / blocked storage */
  }
})(document, sessionStorage);
