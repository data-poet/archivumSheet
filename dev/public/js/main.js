import { bindUI } from "./events/index.js";
import { initNav } from "./components/nav.js";
import { initPageSelector } from "./components/pageSelector.js";
import { initSelectLabels } from "./components/selectLabels.js";
import { initTabs } from "./components/tabs.js";
import { initViewMode } from "./components/viewMode.js";
import { mountResumePanel } from "./components/resume/skeleton.js";
import { initTheme } from "./components/theme.js";
import { setupAutoRun } from "./compute/attributes.js";
import {
  updateActualValues,
  initAttributeTableHeaders,
  renderListsPreserving,
} from "./ui.js";
import { runEngine } from "./compute/index.js";
import { initAutoRun } from "./compute/autorun.js";
import { initCharacterImage } from "./engine/character/portrait/index.js";
import { initCharacters, getActiveKind } from "./store/characters.js";
import { reloadCatalogs } from "./store/catalogs.js";
import { initCharacterSelector } from "./components/characterSelector.js";
import { renderEntryKind } from "./components/entryKind.js";
import { renderAllyLinkControl } from "./components/allies/allyLinkControl.js";
import { initAllyAddControl } from "./components/allies/allyAddInline.js";
import { ENTRY_KINDS } from "./shared/constants.js";
import { state } from "./state.js";
import { AUDIENCE } from "./shared/availability.js";
import { initCardCollapse } from "./shared/cardCollapse.js";

export async function bootstrap() {
  mountResumePanel();
  initAutoRun(runEngine);
  bindUI();
  initNav();
  initPageSelector();
  initTabs();
  initViewMode();
  initTheme();
  setupAutoRun();
  initAttributeTableHeaders();
  initSelectLabels();
  initCardCollapse();
  updateActualValues();

  // The load*() functions only fetch catalogs and populate their own add-form
  // selectors — none of them render. Rendering once here instead costs one DOM
  // sweep rather than one per catalog.
  await reloadCatalogs(
    getActiveKind() === ENTRY_KINDS.ALLY ? AUDIENCE.ALLY : AUDIENCE.PLAYER,
  );

  // initCharacters() applies the active character, which ends in its own
  // renderListsPreserving + triggerAutoRun. Only render here when it couldn't
  // (no persisted character matched), so the empty sheet still paints.
  if (!initCharacters()) {
    renderListsPreserving(state.selected, state.data);
  }

  initCharacterSelector();
  renderEntryKind();
  renderAllyLinkControl();
  await initAllyAddControl();
  initCharacterImage();
}

// Not `window.onload` — that waits on every image, delaying the catalog fetches.
// main.js is a module script, so it always runs before DOMContentLoaded fires.
document.addEventListener("DOMContentLoaded", bootstrap);
