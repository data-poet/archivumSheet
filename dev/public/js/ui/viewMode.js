/**
 * viewMode.js
 *
 * Controls the app-level Edit ↔ View mode toggle.
 *
 * Edit mode (📝) — default: sidebar/bottomnav visible, main content shown.
 *   The resume panel (#tab-char-resume) lives inside #main-content as a
 *   hidden source element. renderResume() always writes into its IDs.
 *
 * View mode (📃) — only topbar + resume:
 *   The resume panel node is physically moved into #view-mode-resume via
 *   appendChild (a real DOM move, not a clone). IDs remain unique; event
 *   listeners and JS-set state (element.hidden, etc.) survive intact.
 *   On exit, the panel is moved back into #main-content.
 *
 * The toggle button (#view-mode-btn) lives in the topbar.
 * Mode is persisted via viewModeState.js (localStorage).
 *
 * Public API:
 *   initViewMode()  — call once from main.js after initTabs().
 *   syncViewMode()  — no-op (kept for call-site compatibility; moves are
 *                     handled by applyMode on toggle, and renderResume()
 *                     writes directly into the live panel wherever it is).
 */

import { isViewMode, setViewMode } from "../store/viewModeState.js";
import { t } from "../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BTN_ID      = "view-mode-btn";
const PANEL_ID    = "tab-char-resume";    // the single resume panel node
const TARGET_ID   = "view-mode-resume";   // view-mode container
const EDIT_HOST_ID = "resume-panel-host"; // edit-mode anchor (empty div in HTML)
const BODY_CLASS  = "is-view-mode";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move the resume panel to the appropriate container.
 * appendChild is idempotent when the node is already in the target — safe
 * to call on every render cycle without double-move risk.
 *
 * @param {boolean} viewMode
 */
function _movePanel(viewMode) {
  const panel  = document.getElementById(PANEL_ID);
  const target = document.getElementById(viewMode ? TARGET_ID : EDIT_HOST_ID);
  if (!panel || !target) return;
  if (panel.parentElement === target) return; // already in the right place
  target.appendChild(panel);
}

/**
 * Apply or remove the view-mode class on <body>, update button, move panel.
 * @param {boolean} viewMode
 */
function applyMode(viewMode) {
  document.body.classList.toggle(BODY_CLASS, viewMode);

  const btn = document.getElementById(BTN_ID);
  if (btn) {
    btn.textContent = viewMode
      ? t("viewMode.btnEdit")   // 📝
      : t("viewMode.btnView");  // 📃
    btn.setAttribute(
      "aria-label",
      viewMode ? t("viewMode.ariaEdit") : t("viewMode.ariaView"),
    );
    btn.setAttribute("aria-pressed", String(viewMode));
  }

  _movePanel(viewMode);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called once from main.js.
 * Reads persisted mode, applies it, and wires the toggle button.
 */
export function initViewMode() {
  applyMode(isViewMode());

  const btn = document.getElementById(BTN_ID);
  if (!btn) return;

  btn.addEventListener("click", () => {
    const next = !isViewMode();
    setViewMode(next);
    applyMode(next);
  });
}

/**
 * Kept for call-site compatibility (called from engine/index.js).
 * No longer needed: renderResume() writes into the live panel node wherever
 * it currently lives, so no explicit sync step is required.
 */
export function syncViewMode() {}
