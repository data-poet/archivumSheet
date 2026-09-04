// Panels are only shown/hidden, never re-rendered — element IDs stay stable, so
// event wiring in events/index.js is unaffected by tab switches.
import { getActiveTab, setActiveTab } from "../store/tabState.js";
import { isCollapsed, setCollapsed } from "../store/sectionCollapseState.js";

export function activateTab(sectionId, tabId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tabId);
  });

  section.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tabId);
  });

  setActiveTab(sectionId, tabId);
}

function applyCollapse(sectionId, collapsed) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const box = section.querySelector(".box");
  if (!box) return;

  box.classList.toggle("is-collapsed", collapsed);

  const btn = section.querySelector(".tab-strip-collapse");
  if (btn) {
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", collapsed ? "Expandir seção" : "Recolher seção");
  }
}

export function initTabs() {
  document.querySelectorAll(".tab-strip").forEach((strip) => {
    const sectionId = strip.dataset.section;
    if (!sectionId) return;

    applyCollapse(sectionId, isCollapsed(sectionId));

    const collapseBtn = strip.querySelector(".tab-strip-collapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nowCollapsed = !isCollapsed(sectionId);
        setCollapsed(sectionId, nowCollapsed);
        applyCollapse(sectionId, nowCollapsed);
      });
    }

    const buttons = Array.from(strip.querySelectorAll(".tab-btn"));
    if (buttons.length === 0) return;

    const saved = getActiveTab(sectionId);
    const firstTabId = buttons[0].dataset.tab;
    const initialTabId = saved ?? firstTabId;

    activateTab(sectionId, initialTabId);

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
