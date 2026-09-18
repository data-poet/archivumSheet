// The character / ally-draft switch that sits above the first section.
//
// The kind is a property of the character entry, never a global UI mode. That is what makes
// authoring safe: every write goes to store.activeId, so a draft can only write to its own row,
// and selecting a real character cannot leave you in ally mode — the control simply follows
// whatever is active.
//
// The radio is the control, but it scrolls away, so the body class drives a persistent topbar
// treatment: the mistake worth designing against is authoring an ally believing it is your
// character.

import { t } from "../localization/pt-BR/index.js";
import { getActiveKind, setActiveKind } from "../store/characters.js";
import { ENTRY_KINDS } from "../shared/constants.js";

const HOST_ID = "entry-kind";
const BODY_CLASS = "is-ally-draft";

export function renderEntryKind() {
  const host = document.getElementById(HOST_ID);
  const kind = getActiveKind();

  document.body.classList.toggle(BODY_CLASS, kind === ENTRY_KINDS.ALLY);

  if (!host) return;

  const option = (value, label) => `
    <label class="entry-kind-option${value === kind ? " is-active" : ""}">
      <input
        type="radio"
        name="entry-kind"
        value="${value}"
        ${value === kind ? "checked" : ""}
      />
      <span>${label}</span>
    </label>`;

  host.innerHTML = `
    <fieldset class="entry-kind">
      <legend class="entry-kind-legend">${t("characters.kindLegend")}</legend>
      ${option(ENTRY_KINDS.CHARACTER, t("characters.kindCharacter"))}
      ${option(ENTRY_KINDS.ALLY, t("characters.kindAlly"))}
      <p class="entry-kind-hint" ${kind === ENTRY_KINDS.ALLY ? "" : "hidden"}>
        ${t("characters.kindAllyHint")}
      </p>
    </fieldset>
  `;
}

export function initEntryKind() {
  renderEntryKind();

  const host = document.getElementById(HOST_ID);
  if (!host) return;

  host.addEventListener("change", (e) => {
    const input = e.target.closest('input[name="entry-kind"]');
    if (!input) return;

    setActiveKind(input.value);
    renderEntryKind();
  });
}
