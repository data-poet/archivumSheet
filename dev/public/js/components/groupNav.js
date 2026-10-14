// Groups only toggle `hidden` on existing sections, never re-render them — same invariant
// as tabs.js, so element IDs and event wiring survive group switches.
// initGroupNav() must run after initNav() (it rescopes the sidebar) and before initTabs().
import { LABELS } from "../localization/pt-BR/index.js";
import { getActiveGroup, setActiveGroup } from "../store/groupState.js";
import { renderSidebarSections } from "./nav.js";

const NAV_ID = "groupnav";

// A stored key can outlive its group (renamed or removed), so unknown keys fall back.
function _resolveGroup(key) {
  const { items } = LABELS.groups;
  return items.find((group) => group.key === key) ?? items[0];
}

function _getButtons() {
  return Array.from(document.querySelectorAll(`#${NAV_ID} .groupnav-btn`));
}

function _buildGroupNav() {
  const nav = document.getElementById(NAV_ID);
  if (!nav) return;

  const { ariaLabel, items } = LABELS.groups;
  nav.setAttribute("aria-label", ariaLabel);
  nav.innerHTML = `
    <div class="groupnav-list" role="tablist">
      ${items
        .map(
          ({ key, label, icon }) => `
        <button
          type="button"
          class="groupnav-btn"
          role="tab"
          data-group="${key}"
          aria-selected="false"
          tabindex="-1"
        >
          <span class="groupnav-icon" aria-hidden="true">${icon}</span>
          <span class="groupnav-label">${label}</span>
        </button>`,
        )
        .join("")}
    </div>`;
}

export function activateGroup(key) {
  const group = _resolveGroup(key);
  const members = new Set(group.sections);

  document.querySelectorAll(".l-section").forEach((section) => {
    section.hidden = !members.has(section.id);
  });

  _getButtons().forEach((btn) => {
    const isActive = btn.dataset.group === group.key;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
    if (isActive) btn.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  });

  renderSidebarSections(group.sections);
  setActiveGroup(group.key);
  return group.key;
}

function _switchTo(key) {
  const previous = _resolveGroup(getActiveGroup()).key;
  if (activateGroup(key) !== previous) window.scrollTo({ top: 0 });
}

export function initGroupNav() {
  _buildGroupNav();
  activateGroup(getActiveGroup());

  const nav = document.getElementById(NAV_ID);
  if (!nav) return;

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".groupnav-btn");
    if (btn) _switchTo(btn.dataset.group);
  });

  nav.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const buttons = _getButtons();
    const current = buttons.findIndex(
      (btn) => btn.dataset.group === getActiveGroup(),
    );
    const next = buttons[(current + step + buttons.length) % buttons.length];
    e.preventDefault();
    _switchTo(next.dataset.group);
    next.focus();
  });
}
