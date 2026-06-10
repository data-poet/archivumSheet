/**
 * tabs.js
 *
 * Owns two related behaviours for each section box:
 *
 *   TAB SWITCHING
 *   - initTabs()    — wire click handlers on every .tab-strip; restore saved tab state
 *   - activateTab() — show the target panel, hide others, update button state, save to tabState
 *
 *   SECTION COLLAPSE
 *   - Sections start collapsed (no re-render, no layout shift on load)
 *   - A chevron button (.tab-strip-collapse) on the right end of each tab strip toggles collapse
 *   - Collapsed state is preserved in sectionCollapseState for the session
 *
 * Tabs are show/hide only — panels are never re-rendered.
 * All element IDs remain stable, so event wiring in events/index.js is unaffected.
 */

import { getActiveTab, setActiveTab } from "../store/tabState.js";
import { isCollapsed, setCollapsed } from "../store/sectionCollapseState.js";

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activate a specific tab panel within a section.
 *
 * @param {string} sectionId  — e.g. "section-traits"
 * @param {string} tabId      — e.g. "tab-advantages"  (matches panel element id)
 */
export function activateTab(sectionId, tabId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Toggle panels
  section.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tabId);
  });

  // Toggle buttons
  section.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tabId);
  });

  setActiveTab(sectionId, tabId);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION COLLAPSE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply the collapsed/expanded state to a section box without animation.
 * Called on init (no transition) and on user toggle (with transition via CSS).
 *
 * @param {string}  sectionId
 * @param {boolean} collapsed
 */
function applyCollapse(sectionId, collapsed) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const box = section.querySelector(".box");
  if (!box) return;

  box.classList.toggle("is-collapsed", collapsed);

  // Update chevron aria-label and rotation
  const btn = section.querySelector(".tab-strip-collapse");
  if (btn) {
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", collapsed ? "Expandir seção" : "Recolher seção");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wire all tab strips and collapse buttons in the document.
 * Call once from main.js after bindUI().
 */
export function initTabs() {
  document.querySelectorAll(".tab-strip").forEach((strip) => {
    const sectionId = strip.dataset.section;
    if (!sectionId) return;

    // ── Collapse: apply initial state (all start collapsed) ─────────────────
    applyCollapse(sectionId, isCollapsed(sectionId));

    // ── Collapse: wire chevron button ────────────────────────────────────────
    const collapseBtn = strip.querySelector(".tab-strip-collapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nowCollapsed = !isCollapsed(sectionId);
        setCollapsed(sectionId, nowCollapsed);
        applyCollapse(sectionId, nowCollapsed);
      });
    }

    // ── Tabs: determine which tab to start on: saved state → first button ───
    const buttons = Array.from(strip.querySelectorAll(".tab-btn"));
    if (buttons.length === 0) return;

    const saved = getActiveTab(sectionId);
    const firstTabId = buttons[0].dataset.tab;
    const initialTabId = saved ?? firstTabId;

    activateTab(sectionId, initialTabId);

    // ── Tabs: click handler — no scroll, no re-render ────────────────────────
    strip.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      const tabId = btn.dataset.tab;
      if (!tabId) return;

      // Clicking a tab on a collapsed section also expands it
      if (isCollapsed(sectionId)) {
        setCollapsed(sectionId, false);
        applyCollapse(sectionId, false);
      }

      activateTab(sectionId, tabId);
    });
  });
}
