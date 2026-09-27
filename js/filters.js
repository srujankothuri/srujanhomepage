// Shows only the project cards that match the selected filter button.
// Each card lists its areas in a data attribute, like data-categories="ml data".
export function initProjectFilters(section) {
  const buttons = [...section.querySelectorAll(".filter-button")];
  const cards = [...section.querySelectorAll(".project-card")];
  const status = section.querySelector(".filters__status");

  function applyFilter(filter) {
    let visibleCount = 0;

    for (const card of cards) {
      const categories = card.dataset.categories.split(" ");
      const matches = filter === "all" || categories.includes(filter);
      card.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    }

    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter)
      );
    }

    const noun = visibleCount === 1 ? "project" : "projects";
    status.textContent = `Showing ${visibleCount} ${noun}`;
  }

  section.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-button");
    if (button) {
      applyFilter(button.dataset.filter);
    }
  });
}
