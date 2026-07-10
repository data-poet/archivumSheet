/**
 * reference/tabs.js
 *
 * Tab switching + section collapse for the reference page's
 * .tab-strip / .tab-panel pairs. Mirrors ../ui/tabs.js's collapse
 * mechanics (same .box.is-collapsed class, same CSS), but sections here
 * start EXPANDED rather than collapsed — this is a consultation page,
 * content should be visible immediately on arrival. The chevron still
 * lets the player collapse a section once they're done with it.
 */

/**
 * Wire every .tab-strip in the document: tab switching + collapse chevron.
 * The first .tab-btn in each strip starts active. Call once after the
 * section/tab DOM has been built.
 */
export function initReferenceTabs() {
  document.querySelectorAll(".tab-strip").forEach((strip) => {
    const sectionId = strip.dataset.section;
    if (!sectionId) return;

    const section = document.getElementById(sectionId);
    const box = section?.querySelector(".box");

    // ── Tabs ────────────────────────────────────────────────────────────
    const buttons = Array.from(strip.querySelectorAll(".tab-btn"));

    const activateTab = (tabId) => {
      if (!section) return;
      section.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("is-active", panel.id === tabId);
      });
      buttons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.tab === tabId);
      });
    };

    if (buttons.length > 0) {
      activateTab(buttons[0].dataset.tab);
    }

    // ── Collapse ────────────────────────────────────────────────────────
    const collapseBtn = strip.querySelector(".tab-strip-collapse");

    const applyCollapse = (collapsed) => {
      if (!box) return;
      box.classList.toggle("is-collapsed", collapsed);
      if (collapseBtn) {
        collapseBtn.setAttribute("aria-expanded", String(!collapsed));
        collapseBtn.setAttribute(
          "aria-label",
          collapsed ? "Expandir seção" : "Recolher seção",
        );
      }
    };

    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nowCollapsed = !box?.classList.contains("is-collapsed");
        applyCollapse(nowCollapsed);
      });
    }

    // ── Combined click handler ─────────────────────────────────────────
    strip.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      const tabId = btn.dataset.tab;
      if (!tabId) return;

      // Clicking a tab on a collapsed section also expands it
      if (box?.classList.contains("is-collapsed")) {
        applyCollapse(false);
      }

      activateTab(tabId);
    });
  });
}
