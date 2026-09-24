// Topbar roster popover, modeled on components/characterSelector.js — same plain-item list +
// divider + labeled actions pattern, so edit/remove act on the active roster entry rather than
// carrying a per-row target.

import { t } from "../localization/pt-BR/index.js";
import {
  getRoster,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  removeRosterEntry,
  forkAllyToLocal,
} from "../store/allies.js";
import { listAllies, isRepoAlly } from "../allies/catalog.js";
import { setActiveCharacterId, loadStore } from "../store/characterStoreCore.js";
import { showConfirm } from "./dialog.js";
import { showToast } from "../shared/toast.js";
import { escapeHtml } from "../shared/renderUtils.js";
import { clickStartedInside } from "../shared/eventDispatch.js";
import { navigateTo } from "../shared/navigate.js";

let _onChange = () => {};
let _index = [];

// Repo entries resolve through the fetched index; a forked/local entry (ally_id is a
// character-store id, not an ALLY_* one) isn't in that index at all — its name lives on
// its own character-store entry instead.
function _entryName(ally_id) {
  const repoName = _index.find((a) => a.ally_id === ally_id)?.name;
  if (repoName) return repoName;

  const localEntry = loadStore()?.list.find((c) => c.id === ally_id);
  return localEntry?.name || ally_id;
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
      <li>
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
    <ul class="char-selector-list">${items}</ul>
    <div class="char-selector-divider"></div>
    <ul class="char-selector-actions">
      ${actionItem("edit-ally", "✎", t("allies.edit"))}
      ${actionItem("remove-ally", "−", t("allies.remove"), " char-selector-action-remove")}
    </ul>
  `;
}

// Repo entries fork into a local draft first — the catalog file stays read-only.
// Local/already-forked entries jump straight to the editor.
async function _handleEdit(instanceId) {
  const entry = getRoster().find((e) => e._instanceId === instanceId);
  if (!entry) return;

  const editId = isRepoAlly(entry.ally_id)
    ? await forkAllyToLocal(instanceId)
    : entry.ally_id;
  if (!editId) return;

  setActiveCharacterId(editId);
  navigateTo("/");
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
        const activeId = getActiveAllyInstanceId();
        if (!activeId) return;
        await _handleEdit(activeId);
        closeSelector({ restoreFocus: true });
        break;
      }

      case "remove-ally": {
        const activeId = getActiveAllyInstanceId();
        if (!activeId) return;
        const entry = getRoster().find((e) => e._instanceId === activeId);
        const name = entry ? _entryName(entry.ally_id) : "";
        const confirmed = await showConfirm({
          title: t("allies.confirmRemoveTitle"),
          message: `${t("allies.confirmRemove")} "${name}"?`,
          confirmLabel: t("allies.remove"),
          danger: true,
        });
        if (!confirmed) return;
        removeRosterEntry(activeId);
        renderPopover();
        updateRosterButton();
        _onChange();
        break;
      }
    }
  });
}
