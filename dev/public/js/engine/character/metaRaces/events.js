import { removeMetaRace } from "./model.js";

export function handleMetaRaceClick(e) {
  if (e.target.classList.contains("remove-meta-race")) {
    removeMetaRace(e.target.dataset.id);
    return true;
  }
  return false;
}
