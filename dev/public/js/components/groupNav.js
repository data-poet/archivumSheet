// Groups only toggle `hidden` on existing sections, never re-render them — same invariant
// as tabs.js, so element IDs and event wiring survive group switches.
// initGroupNav() must run after initNav() (it rescopes the sidebar) and before initTabs().
// The sheet uses the defaults; the reference page passes its own layout, labels and storage key.
import { LABELS } from "../localization/pt-BR/index.js";
import { SHEET_LAYOUT } from "../layout/sheetLayout.js";
import { getActiveGroup, setActiveGroup } from "../store/groupState.js";
import { renderSidebarSections } from "./nav.js";
import { icon } from "../shared/icons.js";

// One group bar is a reusable instance, not a page-wide singleton, so a second one can exist
// on the same page without fighting the first over the same #groupnav id or toggling the
// other's sections. `manageSidebar` lets an instance opt out of the desktop sidebar entirely.
export function createGroupNav({
  navId,
  sectionsRoot = document,
  manageSidebar = true,
} = {}) {
  let _config = {};

  function _layout() {
    return _config.layout ?? SHEET_LAYOUT;
  }

  function _labels() {
    return _config.labels ?? LABELS.nav;
  }

  function _storedGroup() {
    return getActiveGroup(_config.storageKey);
  }

  // A stored key can outlive its group (renamed or removed), so unknown keys fall back.
  function _resolveGroup(key) {
    const layout = _layout();
    return layout.find(({ group }) => group === key) ?? layout[0];
  }

  function _getButtons() {
    return Array.from(document.querySelectorAll(`#${navId} .groupnav-btn`));
  }

  function _buildGroupNav() {
    const nav = document.getElementById(navId);
    if (!nav) return;

    const labels = _labels();
    nav.setAttribute("aria-label", labels.groupsAriaLabel);
    nav.innerHTML = `
    <div class="groupnav-list" role="tablist">
      ${_layout()
        .map(({ group: key, accent, icon: iconName }) => {
          const { label, short } = labels.groups[key] ?? {};
          return `
        <button
          type="button"
          class="groupnav-btn"
          role="tab"
          data-group="${key}"
          ${accent ? `data-accent="${accent}"` : ""}
          aria-label="${label ?? ""}"
          aria-selected="false"
          tabindex="-1"
        >
          <span class="groupnav-icon" aria-hidden="true">${icon(iconName)}</span>
          <span class="groupnav-label" aria-hidden="true">${label ?? ""}</span>
          <span class="groupnav-label-short" aria-hidden="true">${short ?? label ?? ""}</span>
        </button>`;
        })
        .join("")}
    </div>`;
  }

  function activateGroup(key) {
    const { group, sections } = _resolveGroup(key);
    const members = new Set(sections.map(({ id }) => id));

    sectionsRoot.querySelectorAll(".l-section").forEach((section) => {
      section.hidden = !members.has(section.id);
    });

    _getButtons().forEach((btn) => {
      const isActive = btn.dataset.group === group;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
      if (isActive)
        btn.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });

    if (manageSidebar) renderSidebarSections(sections, _labels().sections);
    setActiveGroup(group, _config.storageKey);
    return group;
  }

  function _switchTo(key) {
    const previous = _resolveGroup(_storedGroup()).group;
    if (activateGroup(key) !== previous) window.scrollTo({ top: 0 });
  }

  function initGroupNav({ layout, labels, storageKey } = {}) {
    _config = { layout, labels, storageKey };
    _buildGroupNav();
    activateGroup(_storedGroup());

    const nav = document.getElementById(navId);
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
        (btn) => btn.dataset.group === _storedGroup(),
      );
      const next = buttons[(current + step + buttons.length) % buttons.length];
      e.preventDefault();
      _switchTo(next.dataset.group);
      next.focus();
    });
  }

  return { initGroupNav, activateGroup };
}

// The sheet and reference pages' own single instance — same shape every caller already used
// before this became a factory.
const _default = createGroupNav({ navId: "groupnav" });
export const initGroupNav = _default.initGroupNav;
export const activateGroup = _default.activateGroup;
