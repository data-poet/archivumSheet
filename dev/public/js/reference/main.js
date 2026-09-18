import { buildReferenceSections, loadReferenceContent } from "./content.js";
import { initReferenceNav } from "./nav.js";
import { initReferenceTabs } from "./tabs.js";
import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";

function _hydrateShell() {
  const L = LABELS.reference;
  document.title = L.pageTitle;

  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = L.topbarTitle;
}

window.onload = async () => {
  _hydrateShell();

  buildReferenceSections();
  initReferenceNav();
  initReferenceTabs();
  initTheme();
  initPageSelector();

  await loadReferenceContent();
};
