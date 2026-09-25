import { t } from "../localization/pt-BR/index.js";
import {
  listCharacters,
  listCharactersGrouped,
  getActiveCharacterId,
  loadCharacter,
  addCharacter,
  removeCharacter,
  saveActiveCharacter,
  recreateLinkedAllies,
} from "../store/characters.js";
import {
  exportSheet,
  exportAllySheet,
  importSheet,
  showToast,
} from "../store/persistence.js";
import { replaceActiveCharacter } from "../store/characters.js";
import { showConfirm } from "./dialog.js";
import { escapeHtml } from "../shared/renderUtils.js";
import { ENTRY_KINDS } from "../shared/constants.js";
import { clickStartedInside } from "../shared/eventDispatch.js";
import { isAllyFile } from "../store/allies/allyExport.js";
import { getActiveKind } from "../store/characters.js";
import { renderEntryKind, warnAllyOnlyContent } from "./entryKind.js";
import { renderAllyLinkControl } from "./allies/allyLinkControl.js";
import { renderPageSelector } from "./pageSelector.js";
import { reloadCatalogs } from "../store/catalogs.js";
import { AUDIENCE } from "../shared/availability.js";

function _audienceFor(kind) {
  return kind === ENTRY_KINDS.ALLY ? AUDIENCE.ALLY : AUDIENCE.PLAYER;
}

// Catalogs only need to change when the active entry's kind changes (races/advantages/
// disadvantages carry ally-only rows) — same-kind switches can just repaint. Reloading
// unconditionally would still be correct, just a pointless refetch of every catalog on
// every character switch. Returns whether it actually reloaded, so a caller that already
// applied the character's data against the old catalogs knows to reapply it.
async function _reloadCatalogsIfKindChanged(previousKind, targetKind) {
  if (targetKind === previousKind) return false;
  await reloadCatalogs(_audienceFor(targetKind));
  return true;
}

function _repaintChrome() {
  updateSelectorButton();
  renderEntryKind();
  renderAllyLinkControl();
  renderPageSelector();
}

// A typed name always wins; an untyped one falls back to the sub-race (e.g. a hand-made
// "Elemental de Terra" with no name typed in yet shows its sub-race instead of "Sem nome").
function _displayName(entry) {
  return entry?.name?.trim() || entry?.race?.trim() || t("characters.unnamed");
}

export function updateSelectorButton() {
  const btn = document.getElementById("char-selector-btn");
  if (!btn) return;

  const id = getActiveCharacterId();
  const chars = listCharacters();
  const active = chars.find((c) => c.id === id);

  btn.innerHTML = `
    <span class="char-selector-btn-name">${escapeHtml(_displayName(active))}</span>
    <span class="char-selector-btn-chevron" aria-hidden="true">⌄</span>
  `;
}

function getPopover() {
  return document.getElementById("char-selector-popover");
}

function isOpen() {
  return getPopover()?.classList.contains("is-open") ?? false;
}

function getTriggerButton() {
  return document.getElementById("char-selector-btn");
}

export function openSelector() {
  renderPopover();
  getPopover()?.classList.add("is-open");
  getTriggerButton()?.setAttribute("aria-expanded", "true");
  updateSelectorButton();
  getPopover()?.querySelector("button")?.focus();
}

// restoreFocus is skipped when the popover closes because focus already moved elsewhere
// (an outside click, or an action that opens a dialog / file picker).
export function closeSelector({ restoreFocus = false } = {}) {
  getPopover()?.classList.remove("is-open");
  getTriggerButton()?.setAttribute("aria-expanded", "false");
  if (restoreFocus) getTriggerButton()?.focus();
}

export function toggleSelector() {
  if (isOpen()) closeSelector();
  else openSelector();
}

export function renderPopover() {
  const popover = getPopover();
  if (!popover) return;

  const chars = listCharactersGrouped();
  const activeId = getActiveCharacterId();

  const charItems = chars
    .map((c) => {
      const isActive = c.id === activeId;
      const isAlly = c.kind === ENTRY_KINDS.ALLY;
      return `
      <li>
        <button type="button"
            class="char-selector-item${isActive ? " is-active" : ""}${c.indented ? " char-selector-item--indented" : ""}"
            data-action="select-char"
            data-id="${c.id}"
            ${isActive ? 'aria-current="true"' : ""}>
          <span class="char-selector-radio" aria-hidden="true">${isActive ? "⦿" : "○"}</span>
          <span class="char-selector-item-info">
            <span class="char-selector-item-name">${escapeHtml(_displayName(c))}</span>
          </span>
          ${isAlly ? `<span class="char-selector-item-kind" title="${t("characters.kindBadgeTitle")}">${t("characters.kindBadge")}</span>` : ""}
        </button>
      </li>`;
    })
    .join("");

  const actionItem = (action, icon, label, extraClass = "") => `
      <li>
        <button type="button" class="char-selector-action-item${extraClass}" data-action="${action}">
          <span class="char-selector-action-icon" aria-hidden="true">${icon}</span>
          <span>${label}</span>
        </button>
      </li>`;

  popover.innerHTML = `
    <ul class="char-selector-list">
      ${charItems}
    </ul>
    <div class="char-selector-divider"></div>
    <ul class="char-selector-actions">
      ${actionItem("add-char", "+", t("characters.add"))}
      ${actionItem("add-ally", "+", t("characters.addAlly"))}
      ${actionItem("remove-char", "−", t("characters.remove"), " char-selector-action-remove")}
      <li class="char-selector-divider" role="presentation"></li>
      ${actionItem("import-char", "⬆️", t("app.import"))}
      ${actionItem("export-char", "⬇️", t("app.export"))}
      ${actionItem("replace-char", "🔄", t("characters.replace"))}
    </ul>
  `;
}

export function initCharacterSelector() {
  updateSelectorButton();
  renderPopover();

  const btn = getTriggerButton();
  if (btn) {
    // Allowed to reach document on purpose — see the note on the page selector's trigger.
    btn.addEventListener("click", () => {
      toggleSelector();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    closeSelector({ restoreFocus: true });
  });

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (clickStartedInside(e, getPopover(), getTriggerButton())) return;
    closeSelector();
  });

  const popover = getPopover();
  if (!popover) return;

  popover.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-action]");
    if (!item) return;

    const action = item.dataset.action;
    const id = item.dataset.id;

    switch (action) {
      case "select-char": {
        if (id === getActiveCharacterId()) {
          closeSelector({ restoreFocus: true });
          return;
        }
        const previousKind = getActiveKind();
        const targetKind =
          listCharacters().find((c) => c.id === id)?.kind ??
          ENTRY_KINDS.CHARACTER;
        saveActiveCharacter();
        closeSelector({ restoreFocus: true });
        // Catalogs must already match the new kind before loadCharacter() applies its data,
        // or race restoration (store/characters.js's _applyData) runs against the old audience.
        await _reloadCatalogsIfKindChanged(previousKind, targetKind);
        loadCharacter(id);
        _repaintChrome();
        break;
      }

      case "add-char": {
        // No pre-filled default value: prompt()'s second argument becomes the literal
        // submitted text if the user just clicks OK, which would defeat the blank-name
        // fallback below before it ever gets a chance to apply.
        const name = prompt(t("characters.namePrompt"));
        if (name === null) return;
        await _reloadCatalogsIfKindChanged(
          getActiveKind(),
          ENTRY_KINDS.CHARACTER,
        );
        // A blank name is kept blank (not defaulted to placeholder text) so
        // _displayName()'s name → race → "unnamed" fallback has a real blank to fall through.
        addCharacter(name.trim());
        closeSelector({ restoreFocus: true });
        _repaintChrome();
        break;
      }

      case "add-ally": {
        // See the add-char comment above — no pre-filled default value.
        const name = prompt(t("characters.namePrompt"));
        if (name === null) return;
        await _reloadCatalogsIfKindChanged(getActiveKind(), ENTRY_KINDS.ALLY);
        // See the add-char comment above — an ally left unnamed falls through to its
        // sub-race in the selector once one is picked (this is the case that matters most:
        // a hand-made ally is often identified by species alone, e.g. "Elemental de Terra").
        addCharacter(name.trim(), ENTRY_KINDS.ALLY);
        closeSelector({ restoreFocus: true });
        _repaintChrome();
        break;
      }

      case "remove-char": {
        const chars = listCharacters();
        if (chars.length <= 1) {
          showToast(t("characters.cannotRemoveLast"), "error");
          return;
        }
        const active = chars.find((c) => c.id === getActiveCharacterId());
        const name = active?.name || t("characters.unnamed");
        const confirmed = await showConfirm({
          title: t("characters.confirmRemoveTitle"),
          message: `${t("characters.confirmRemove")} "${name}"?`,
          confirmLabel: t("characters.remove"),
          danger: true,
        });
        if (!confirmed) return;
        const previousKind = getActiveKind();
        removeCharacter(getActiveCharacterId());
        closeSelector({ restoreFocus: true });
        // Whichever character becomes active next may have a different kind than the one
        // just removed — removeCharacter() already repainted once against the old catalogs,
        // so reapply if that turns out to have been wrong.
        const reloaded = await _reloadCatalogsIfKindChanged(
          previousKind,
          getActiveKind(),
        );
        if (reloaded) loadCharacter(getActiveCharacterId());
        _repaintChrome();
        break;
      }

      case "export-char": {
        // An ally IS the ally file — there is no separate "plain" export for it. Exporting it
        // the character way would drop the `portrait` marker isAllyFile() relies on, so
        // re-importing it later would silently turn it back into a plain character.
        if (getActiveKind() === ENTRY_KINDS.ALLY) {
          exportAllySheet();
        } else {
          warnAllyOnlyContent();
          exportSheet();
        }
        closeSelector({ restoreFocus: true });
        break;
      }

      case "import-char": {
        const input = document.getElementById("importFileInput");
        if (input) {
          input._mode = "import";
          input.click();
        }
        closeSelector();
        break;
      }

      case "replace-char": {
        const input = document.getElementById("importFileInput");
        if (input) {
          input._mode = "replace";
          input.click();
        }
        closeSelector();
        break;
      }
    }
  });

  const fileInput = document.getElementById("importFileInput");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        if (fileInput._mode === "replace") {
          const text = await file.text();
          const payload = JSON.parse(text);
          if (!payload?.version || !payload?.character || !payload?.inventory) {
            throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
          }
          replaceActiveCharacter(payload);
          if (payload.linked_allies) {
            recreateLinkedAllies(payload.linked_allies, getActiveCharacterId());
          }
          _repaintChrome();
        } else {
          const text = await file.text();
          const payload = JSON.parse(text);
          if (!payload?.version || !payload?.character || !payload?.inventory) {
            throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
          }
          const name =
            payload?.pc?.character_name?.trim() || t("characters.unnamed");
          const previousKind = getActiveKind();
          const targetKind = isAllyFile(payload)
            ? ENTRY_KINDS.ALLY
            : ENTRY_KINDS.CHARACTER;
          addCharacter(name, targetKind);
          // addCharacter loads a blank character; overwrite it with the imported data.
          replaceActiveCharacter(payload);
          if (payload.linked_allies) {
            recreateLinkedAllies(payload.linked_allies, getActiveCharacterId());
          }
          // The imported character's kind may differ from whatever was active before —
          // addCharacter/replaceActiveCharacter above already applied it against the old
          // catalogs, so reapply once they're reloaded for the right audience.
          const reloaded = await _reloadCatalogsIfKindChanged(
            previousKind,
            targetKind,
          );
          if (reloaded) loadCharacter(getActiveCharacterId());
          _repaintChrome();
          return;
        }
      } catch (err) {
        showToast(
          `${t("characters.importErrorPrefix")}: ${err.message}`,
          "error",
        );
      } finally {
        fileInput.value = "";
        fileInput._mode = null;
      }
    });
  }
}
