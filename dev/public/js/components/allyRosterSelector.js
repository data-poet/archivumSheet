// Topbar roster popover, modeled on components/characterSelector.js. "Edit" is a stub in
// this batch — forking a repo ally into a locally-editable draft lands in a later batch.

import { t } from "../localization/pt-BR/index.js";
import {
  getRoster,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  removeRosterEntry,
} from "../store/allies.js";
import { listAllies } from "../allies/catalog.js";
import { showConfirm } from "./dialog.js";
import { showToast } from "../shared/toast.js";
import { escapeHtml } from "../shared/renderUtils.js";
import { clickStartedInside } from "../shared/eventDispatch.js";

let _onChange = () => {};
let _index = [];

function _entryName(ally_id) {
  return _index.find((a) => a.ally_id === ally_id)?.name || ally_id;
}

function getPopover() {
  return document.getElementById("ally-selector-popover");
}

function isOpen() {
  return getPopover()?.classList.contains("is-open") ?? false;
}

function getTriggerButton() {
  return document.getElementById("ally-selector-btn");
}

export function updateRosterButton() {
  const btn = getTriggerButton();
  if (!btn) return;

  const activeId = getActiveAllyInstanceId();
  const active = getRoster().find((e) => e._instanceId === activeId);
  const name = active ? _entryName(active.ally_id) : t("allies.pickPrompt");

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

  const roster = getRoster();
  const activeId = getActiveAllyInstanceId();

  if (roster.length === 0) {
    popover.innerHTML = `<p class="char-selector-empty">${t("allies.rosterEmpty")}</p>`;
    return;
  }

  const items = roster
    .map((entry) => {
      const isActive = entry._instanceId === activeId;
      const name = _entryName(entry.ally_id);
      return `
      <li class="ally-selector-row">
        <button type="button"
            class="char-selector-item${isActive ? " is-active" : ""}"
            data-action="select-ally"
            data-id="${entry._instanceId}"
            ${isActive ? 'aria-current="true"' : ""}>
          <span class="char-selector-radio" aria-hidden="true">${isActive ? "⦿" : "○"}</span>
          <span class="char-selector-item-info">
            <span class="char-selector-item-name">${escapeHtml(name)}</span>
          </span>
        </button>
        <button type="button" class="char-selector-action-icon" data-action="edit-ally" data-id="${entry._instanceId}" aria-label="${t("allies.edit")}">✎</button>
        <button type="button" class="char-selector-action-icon" data-action="remove-ally" data-id="${entry._instanceId}" aria-label="${t("allies.remove")}">−</button>
      </li>`;
    })
    .join("");

  popover.innerHTML = `<ul class="char-selector-list">${items}</ul>`;
}

// Wired to a no-op stub — real fork-on-edit logic lands in a later batch.
function _handleEdit() {
  showToast(t("allies.editNotAvailable"), "info");
}

export function initAllyRosterSelector({ index = [], onChange = () => {} } = {}) {
  _index = index;
  _onChange = onChange;

  updateRosterButton();
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

  popover.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-action]");
    if (!item) return;

    const action = item.dataset.action;
    const id = item.dataset.id;

    switch (action) {
      case "select-ally": {
        if (id === getActiveAllyInstanceId()) {
          closeSelector({ restoreFocus: true });
          return;
        }
        setActiveAllyInstanceId(id);
        closeSelector({ restoreFocus: true });
        updateRosterButton();
        _onChange();
        break;
      }

      case "edit-ally": {
        _handleEdit(id);
        closeSelector({ restoreFocus: true });
        break;
      }

      case "remove-ally": {
        const entry = getRoster().find((e) => e._instanceId === id);
        const name = entry ? _entryName(entry.ally_id) : "";
        const confirmed = await showConfirm({
          title: t("allies.confirmRemoveTitle"),
          message: `${t("allies.confirmRemove")} "${name}"?`,
          confirmLabel: t("allies.remove"),
          danger: true,
        });
        if (!confirmed) return;
        removeRosterEntry(id);
        renderPopover();
        updateRosterButton();
        _onChange();
        break;
      }
    }
  });
}
