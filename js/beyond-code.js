// Interactive effects for the Beyond Code page:
// a cursor-following spotlight on tiles, and tiles that reveal on scroll.

const bento = document.querySelector(".bento");

function initSpotlight(grid) {
  grid.addEventListener("pointermove", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile) {
      return;
    }
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    tile.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  });
}

function initReveal(grid) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const tiles = [...grid.querySelectorAll(".tile")];
  tiles.forEach((tile, index) => {
    tile.style.setProperty("--reveal-delay", `${index * 70}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  // Tiles only start hidden once this class is added, so the page still
  // shows everything if JavaScript never runs.
  document.body.classList.add("reveal-ready");
  tiles.forEach((tile) => observer.observe(tile));
}

if (bento) {
  initSpotlight(bento);
  initReveal(bento);
}
