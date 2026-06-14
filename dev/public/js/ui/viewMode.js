/**
 * viewMode.js
 *
 * Controls the app-level Edit ↔ View mode toggle.
 *
 * Edit mode (📝) — default app: sidebar/bottomnav visible, main content shown.
 * View mode  (📃) — only topbar + resume view: sidebar/bottomnav hidden,
 *                   main content hidden, #view-mode-resume shown.
 *
 * The toggle button (#view-mode-btn) lives in the topbar.
 * Mode is persisted via viewModeState.js (localStorage).
 *
 * Public API:
 *   initViewMode()  — call once from main.js after initTabs(); reads persisted
 *                     state, applies it to the DOM, wires the button.
 *   syncViewMode()  — call after every renderResume() so the view-mode panel
 *                     always reflects the latest engine output.
 */

import { isViewMode, setViewMode } from "../store/viewModeState.js";
import { t } from "../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BTN_ID = "view-mode-btn";
const SOURCE_ID = "tab-char-resume";   // the existing resume panel (edit mode)
const TARGET_ID = "view-mode-resume";  // the full-page view mode container
const MAIN_ID = "main-content";
const SIDEBAR_ID = "sidebar";
const BOTTOMNAV_ID = "bottomnav";
const BODY_CLASS = "is-view-mode";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clone the resume panel content into the view-mode container.
 * We use cloneNode(true) rather than innerHTML so that JS-set properties
 * (e.g. element.hidden, element.textContent) are copied faithfully.
 * IDs in the clone are suffixed with "-vm" to avoid duplicate-ID conflicts;
 * the originals in #tab-char-resume remain the sole targets for renderResume().
 */
function syncResumeContent() {
  const source = document.getElementById(SOURCE_ID);
  const target = document.getElementById(TARGET_ID);
  if (!source || !target) return;

  // Deep-clone the live DOM tree (copies .hidden, .textContent, etc.)
  const clone = source.cloneNode(true);

  // Remove all id attributes from the clone to prevent duplicate IDs.
  // Event delegation on document handles clicks; no IDs are needed in the clone.
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

  // Replace target contents with the fresh clone's children
  target.replaceChildren(...clone.childNodes);
}

/**
 * Apply or remove the view-mode class on <body> and update button label.
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

  // Sync content into the view panel whenever entering view mode,
  // so the panel is never shown stale.
  if (viewMode) syncResumeContent();
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
 * Called at the end of every renderResume() invocation (via engine/index.js).
 * Keeps the view-mode panel live while in view mode.
 */
export function syncViewMode() {
  if (isViewMode()) syncResumeContent();
}
