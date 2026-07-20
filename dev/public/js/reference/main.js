import { buildReferenceSections, loadReferenceContent } from "./content.js";
import { initReferenceNav } from "./nav.js";
import { initReferenceTabs } from "./tabs.js";
import { initTheme } from "../ui/theme.js";
import { LABELS } from "../localization/pt-BR.js";

function _hydrateShell() {
  const L = LABELS.reference;
  document.title = L.pageTitle;

  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = L.topbarTitle;

  const backBtn = document.getElementById("back-to-sheet-btn");
  if (backBtn) {
    backBtn.setAttribute("aria-label", L.backToSheet);
    backBtn.setAttribute("title", L.backToSheet);
  }
}

window.onload = async () => {
  _hydrateShell();

  buildReferenceSections();
  initReferenceNav();
  initReferenceTabs();
  initTheme();

  await loadReferenceContent();
};
