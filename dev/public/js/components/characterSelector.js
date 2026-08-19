// ui/characterSelector.js
// ─────────────────────────────────────────────────────────────────────────────
// Builds and manages the character selector popover.
// Called from main.js (init) and after any character list mutation.
// ─────────────────────────────────────────────────────────────────────────────

import { t } from "../localization/pt-BR.js";
import {
  listCharacters,
  getActiveCharacterId,
  loadCharacter,
  addCharacter,
  removeCharacter,
  saveActiveCharacter,
} from "../store/characters.js";
import { exportSheet, importSheet, showToast } from "../store/persistence.js";
import { replaceActiveCharacter } from "../store/characters.js";
import { showConfirm } from "./dialog.js";

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR BUTTON — shows active character name + race, opens popover on click
// ─────────────────────────────────────────────────────────────────────────────

export function updateSelectorButton() {
  const btn = document.getElementById("char-selector-btn");
  if (!btn) return;

  const id = getActiveCharacterId();
  const chars = listCharacters();
  const active = chars.find((c) => c.id === id);

  const name = active?.name?.trim() || t("characters.unnamed");
  const race = active?.race?.trim();

  btn.innerHTML = `
    <span class="char-selector-btn-name">${name}</span>
    ${race ? `<span class="char-selector-btn-race">${race}</span>` : ""}
    <span class="char-selector-btn-chevron" aria-hidden="true">⌄</span>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// POPOVER
// ─────────────────────────────────────────────────────────────────────────────

function getPopover() {
  return document.getElementById("char-selector-popover");
}

function isOpen() {
  return getPopover()?.classList.contains("is-open") ?? false;
}

export function openSelector() {
  renderPopover();
  getPopover()?.classList.add("is-open");
  updateSelectorButton();
}

export function closeSelector() {
  getPopover()?.classList.remove("is-open");
}

export function toggleSelector() {
  if (isOpen()) closeSelector();
  else openSelector();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER POPOVER CONTENTS
// ─────────────────────────────────────────────────────────────────────────────

export function renderPopover() {
  const popover = getPopover();
  if (!popover) return;

  const chars = listCharacters();
  const activeId = getActiveCharacterId();

  const charItems = chars
    .map((c) => {
      const isActive = c.id === activeId;
      const name = c.name?.trim() || t("characters.unnamed");
      const race = c.race?.trim();
      return `
      <li class="char-selector-item${isActive ? " is-active" : ""}"
          data-action="select-char"
          data-id="${c.id}"
          role="option"
          aria-selected="${isActive}">
        <span class="char-selector-radio" aria-hidden="true">${isActive ? "⦿" : "○"}</span>
        <span class="char-selector-item-info">
          <span class="char-selector-item-name">${name}</span>
          ${race ? `<span class="char-selector-item-race">${race}</span>` : ""}
        </span>
      </li>`;
    })
    .join("");

  popover.innerHTML = `
    <ul class="char-selector-list" role="listbox">
      ${charItems}
    </ul>
    <div class="char-selector-divider"></div>
    <ul class="char-selector-actions">
      <li class="char-selector-action-item" data-action="add-char">
        <span class="char-selector-action-icon">+</span>
        <span>${t("characters.add")}</span>
      </li>
      <li class="char-selector-action-item char-selector-action-remove" data-action="remove-char">
        <span class="char-selector-action-icon">−</span>
        <span>${t("characters.remove")}</span>
      </li>
      <div class="char-selector-divider"></div>
      <li class="char-selector-action-item" data-action="import-char">
        <span class="char-selector-action-icon">⬆️</span>
        <span>${t("app.import")}</span>
      </li>
      <li class="char-selector-action-item" data-action="export-char">
        <span class="char-selector-action-icon">⬇️</span>
        <span>${t("app.export")}</span>
      </li>
      <li class="char-selector-action-item" data-action="replace-char">
        <span class="char-selector-action-icon">🔄</span>
        <span>${t("characters.replace")}</span>
      </li>
    </ul>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT WIRING — delegated on the popover itself
// ─────────────────────────────────────────────────────────────────────────────

export function initCharacterSelector() {
  updateSelectorButton();
  renderPopover();

  // Toggle popover when topbar button is clicked
  const btn = document.getElementById("char-selector-btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSelector();
    });
  }

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const popover = getPopover();
    const btnEl = document.getElementById("char-selector-btn");
    if (!popover?.contains(e.target) && !btnEl?.contains(e.target)) {
      closeSelector();
    }
  });

  // Delegated click inside popover
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
          closeSelector();
          return;
        }
        saveActiveCharacter();
        loadCharacter(id);
        closeSelector();
        updateSelectorButton();
        break;
      }

      case "add-char": {
        const name = prompt(
          t("characters.namePrompt"),
          t("characters.newCharacter"),
        );
        if (name === null) return; // cancelled
        addCharacter(name.trim() || t("characters.newCharacter"));
        closeSelector();
        updateSelectorButton();
        break;
      }

      case "remove-char": {
        const chars = listCharacters();
        if (chars.length <= 1) {
          // Don't remove the last character, just reset it
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
        removeCharacter(getActiveCharacterId());
        closeSelector();
        updateSelectorButton();
        break;
      }

      case "export-char": {
        exportSheet();
        closeSelector();
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

  // File input handler (import vs replace)
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
          updateSelectorButton();
        } else {
          // import = new character slot
          const text = await file.text();
          const payload = JSON.parse(text);
          if (!payload?.version || !payload?.character || !payload?.inventory) {
            throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
          }
          const name =
            payload?.pc?.character_name?.trim() || t("characters.unnamed");
          addCharacter(name);
          // addCharacter already loads blank; now replace its data with the import
          replaceActiveCharacter(payload);
          updateSelectorButton();
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
