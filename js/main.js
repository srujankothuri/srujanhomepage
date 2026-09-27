import { renderJourney } from "./journey.js";
import { initProjectFilters } from "./filters.js";

// main.js runs on every page, so each feature starts only if its section exists.
const journeyContainer = document.querySelector("#journey-graph");
if (journeyContainer) {
  renderJourney(journeyContainer);
}

const projectsSection = document.querySelector("#all-projects");
if (projectsSection) {
  initProjectFilters(projectsSection);
}
