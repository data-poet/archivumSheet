import { buildReferenceSections, loadReferenceContent } from "./content.js";
import { REFERENCE_LAYOUT, REFERENCE_SECTIONS } from "./referenceLayout.js";
import { configureMarked, mountGlossaryPopovers } from "./markdown.js";
import { initAccordionScroll } from "./enhance.js";
import { initNav } from "../components/nav.js";
import { initGroupNav } from "../components/groupNav.js";
import { initTabs } from "../components/tabs.js";
import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";

// Separate from the sheet's key, whose group ids would otherwise fall back to the first group here.
const GROUP_STORAGE_KEY = "archivum:referenceGroup";

function _hydrateShell() {
  const L = LABELS.reference;
  document.title = L.pageTitle;

  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = L.topbarTitle;
}

window.onload = async () => {
  _hydrateShell();

  buildReferenceSections();
  initNav({
    sections: REFERENCE_SECTIONS,
    labels: LABELS.reference.nav.sections,
  });
  initGroupNav({
    layout: REFERENCE_LAYOUT,
    labels: LABELS.reference.nav,
    storageKey: GROUP_STORAGE_KEY,
  });
  initTabs();
  initTheme();
  initPageSelector();

  configureMarked();
  initAccordionScroll();
  mountGlossaryPopovers();
  await loadReferenceContent();
};
