import { buildReferenceSections, loadReferenceContent } from "./content.js";
import { REFERENCE_LAYOUT } from "./referenceLayout.js";
import { configureMarked, mountGlossaryPopovers } from "./markdown.js";
import { initAccordionScroll } from "./enhance.js";
import { initDeepLinks } from "./deepLink.js";
import { initSearch } from "./search.js";
import { initGroupNav } from "./groupNav.js";
import { initTabs } from "../components/tabs.js";
import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";
import { icon } from "../shared/icons.js";
import { STORAGE_KEYS } from "../shared/storageKeys.js";

// Separate from the sheet's key, whose group ids would otherwise fall back to the first group here.
const GROUP_STORAGE_KEY = STORAGE_KEYS.referenceGroup;

function _hydrateShell() {
  const L = LABELS.reference;
  document.title = L.pageTitle;

  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = L.topbarTitle;

  const searchBtn = document.getElementById("reference-search-btn");
  if (searchBtn) searchBtn.innerHTML = icon("search");
}

window.onload = async () => {
  _hydrateShell();

  buildReferenceSections();
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
  initSearch();
  initDeepLinks();
};
