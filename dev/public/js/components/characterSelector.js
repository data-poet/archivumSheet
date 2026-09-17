import { t } from "../localization/pt-BR/index.js";
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
import { escapeHtml } from "../shared/renderUtils.js";

export function updateSelectorButton() {
  const btn = document.getElementById("char-selector-btn");
  if (!btn) return;

  const id = getActiveCharacterId();
  const chars = listCharacters();
  const active = chars.find((c) => c.id === id);

  const name = active?.name?.trim() || t("characters.unnamed");
  const race = active?.race?.trim();

  btn.innerHTML = `
    <span class="char-selector-btn-name">${escapeHtml(name)}</span>
    ${race ? `<span class="char-selector-btn-race">${escapeHtml(race)}</span>` : ""}
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

  const chars = listCharacters();
  const activeId = getActiveCharacterId();

  const charItems = chars
    .map((c) => {
      const isActive = c.id === activeId;
      const name = c.name?.trim() || t("characters.unnamed");
      const race = c.race?.trim();
      return `
      <li>
        <button type="button"
            class="char-selector-item${isActive ? " is-active" : ""}"
            data-action="select-char"
            data-id="${c.id}"
            ${isActive ? 'aria-current="true"' : ""}>
          <span class="char-selector-radio" aria-hidden="true">${isActive ? "⦿" : "○"}</span>
          <span class="char-selector-item-info">
            <span class="char-selector-item-name">${escapeHtml(name)}</span>
            ${race ? `<span class="char-selector-item-race">${escapeHtml(race)}</span>` : ""}
          </span>
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
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSelector();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    closeSelector({ restoreFocus: true });
  });

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const popover = getPopover();
    const btnEl = getTriggerButton();
    if (!popover?.contains(e.target) && !btnEl?.contains(e.target)) {
      closeSelector();
    }
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
        saveActiveCharacter();
        loadCharacter(id);
        closeSelector({ restoreFocus: true });
        updateSelectorButton();
        break;
      }

      case "add-char": {
        const name = prompt(
          t("characters.namePrompt"),
          t("characters.newCharacter"),
        );
        if (name === null) return;
        addCharacter(name.trim() || t("characters.newCharacter"));
        closeSelector({ restoreFocus: true });
        updateSelectorButton();
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
        removeCharacter(getActiveCharacterId());
        closeSelector({ restoreFocus: true });
        updateSelectorButton();
        break;
      }

      case "export-char": {
        exportSheet();
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
          updateSelectorButton();
        } else {
          const text = await file.text();
          const payload = JSON.parse(text);
          if (!payload?.version || !payload?.character || !payload?.inventory) {
            throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
          }
          const name =
            payload?.pc?.character_name?.trim() || t("characters.unnamed");
          addCharacter(name);
          // addCharacter loads a blank character; overwrite it with the imported data.
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
