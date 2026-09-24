// Ally-edit page's "which character owns this ally" control (Part B, ALLIES_FEATURE.md item
// 14). Renders nothing when the active entry isn't kind: "ally" — entryKind.js's `is-ally-draft`
// body class (see entry-kind.css) is what actually hides the row; this only skips rebuilding it.

import { t } from "../localization/pt-BR/index.js";
import {
  getActiveKind,
  getActiveCharacterId,
  listCharacters,
  getAllyOwnerId,
  linkAllyToCharacter,
  unlinkAlly,
} from "../store/characters.js";
import { ENTRY_KINDS } from "../shared/constants.js";
import { escapeHtml } from "../shared/renderUtils.js";

function getMount() {
  return document.getElementById("ally-link-control");
}

export function renderAllyLinkControl() {
  const mount = getMount();
  if (!mount) return;

  if (getActiveKind() !== ENTRY_KINDS.ALLY) {
    mount.innerHTML = "";
    return;
  }

  const activeId = getActiveCharacterId();
  const ownerId = getAllyOwnerId(activeId);
  const targets = listCharacters().filter((c) => c.kind !== ENTRY_KINDS.ALLY);

  const options = [
    `<option value="">${escapeHtml(t("characters.linkNone"))}</option>`,
    ...targets.map((c) => {
      const name = c.name?.trim() || t("characters.unnamed");
      return `<option value="${c.id}"${c.id === ownerId ? " selected" : ""}>${escapeHtml(name)}</option>`;
    }),
  ].join("");

  mount.innerHTML = `
    <div class="ally-link-control">
      <label for="ally-link-select">${escapeHtml(t("characters.linkLabel"))}</label>
      <select id="ally-link-select">${options}</select>
    </div>
  `;

  mount.querySelector("#ally-link-select")?.addEventListener("change", (e) => {
    const targetId = e.target.value;
    if (targetId) linkAllyToCharacter(activeId, targetId);
    else unlinkAlly(activeId);

    renderAllyLinkControl();
  });
}
