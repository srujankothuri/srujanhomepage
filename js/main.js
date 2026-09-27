import { renderJourney } from "./journey.js";

const journeyContainer = document.querySelector("#journey-graph");
if (journeyContainer) {
  renderJourney(journeyContainer);
}
