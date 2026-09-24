// Topbar switcher for which character's ally roster the allies page is showing — lets the
// page cycle through characters without bouncing back to the sheet. Unlike
// components/characterSelector.js this never adds/removes/imports/exports anything: it only
// flips store.activeId (via characterStoreCore.js, never characters.js — see the import-graph
// guard in tests/dev/allies/main.test.js) and re-renders in place. Ally-kind entries are
// excluded from the list — an ally can't have its own roster.

import { t } from "../localization/pt-BR/index.js";
import { listSwitchableCharacters } from "../store/allies.js";
import {
  getActiveCharacterId,
  setActiveCharacterId,
} from "../store/characterStoreCore.js";
import { escapeHtml } from "../shared/renderUtils.js";
import { clickStartedInside } from "../shared/eventDispatch.js";

let _onChange = () => {};

function getPopover() {
  return document.getElementById("pc-selector-popover");
}

function isOpen() {
  return getPopover()?.classList.contains("is-open") ?? false;
}

function getTriggerButton() {
  return document.getElementById("pc-selector-btn");
}

export function updatePcSwitcherButton() {
  const btn = getTriggerButton();
  if (!btn) return;

  const activeId = getActiveCharacterId();
  const active = listSwitchableCharacters().find((c) => c.id === activeId);
  const name = active?.name?.trim() || t("characters.unnamed");

  btn.innerHTML = `
    <span class="char-selector-btn-name">${escapeHtml(name)}</span>
    <span class="char-selector-btn-chevron" aria-hidden="true">⌄</span>
  `;
}

export function openSelector() {
  renderPopover();
  getPopover()?.classList.add("is-open");
  getTriggerButton()?.setAttribute("aria-expanded", "true");
  getPopover()?.querySelector("button")?.focus();
}

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

  const chars = listSwitchableCharacters();
  const activeId = getActiveCharacterId();

  if (chars.length === 0) {
    popover.innerHTML = `<p class="char-selector-empty">${t("allies.noCharacters")}</p>`;
    return;
  }

  const items = chars
    .map((c) => {
      const isActive = c.id === activeId;
      const name = c.name?.trim() || t("characters.unnamed");
      return `
      <li>
        <button type="button"
            class="char-selector-item${isActive ? " is-active" : ""}"
            data-action="select-pc"
            data-id="${c.id}"
            ${isActive ? 'aria-current="true"' : ""}>
          <span class="char-selector-radio" aria-hidden="true">${isActive ? "⦿" : "○"}</span>
          <span class="char-selector-item-info">
            <span class="char-selector-item-name">${escapeHtml(name)}</span>
          </span>
        </button>
      </li>`;
    })
    .join("");

  popover.innerHTML = `<ul class="char-selector-list">${items}</ul>`;
}

export function initPcSwitcher({ onChange = () => {} } = {}) {
  _onChange = onChange;

  updatePcSwitcherButton();
  renderPopover();

  const btn = getTriggerButton();
  if (btn) {
    btn.addEventListener("click", () => toggleSelector());
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

  popover.addEventListener("click", (e) => {
    const item = e.target.closest('[data-action="select-pc"]');
    if (!item) return;

    const id = item.dataset.id;
    if (id === getActiveCharacterId()) {
      closeSelector({ restoreFocus: true });
      return;
    }

    setActiveCharacterId(id);
    closeSelector({ restoreFocus: true });
    updatePcSwitcherButton();
    _onChange();
  });
}
