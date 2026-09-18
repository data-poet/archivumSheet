// Entry point for the allies page.
//
// It must NOT import compute/ — runEngine() ends every build with
// saveActiveCharacter(), which rebuilds the whole active character from the sheet page's
// own DOM (#weight, #ST_base, ...). Those elements don't exist here, so reaching that
// pipeline from this page would overwrite the player's character with a blank sheet.
// The ally build path and its narrow persistence are this page's own.

import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";

function _hydrateShell() {
  const L = LABELS.allies;
  document.title = `${LABELS.app.title} — ${L.pageTitle}`;

  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = L.topbarTitle;

  const empty = document.getElementById("allies-empty");
  if (empty) empty.textContent = L.emptyHint;
}

export function bootstrapAllies() {
  _hydrateShell();
  initTheme();
  initPageSelector();
}

document.addEventListener("DOMContentLoaded", bootstrapAllies);
