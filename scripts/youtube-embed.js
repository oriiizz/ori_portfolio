(() => {
  const iframes = document.querySelectorAll('.project-hero-video iframe[src*="youtube.com/embed"]');

  iframes.length === 0) {
    return;
  }

  const origin = window.location.origin;

  iframes.forEach((iframe) => {
    let url;

    try {
      url = new URL(iframe.getAttribute("src"), window.location.href);
    } catch {
      return;
    }

    if (!url.searchParams.has("rel")) {
      url.searchParams.set("rel", "0");
    }

    if (origin && origin !== "null") {
      url.searchParams.set("origin", origin);
    }

    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute("allowfullscreen", "");
    iframe.src = url.toString();
  });
})();
