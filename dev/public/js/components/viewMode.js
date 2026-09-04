// View mode physically moves the single resume panel node into #view-mode-resume via
// appendChild (a real DOM move, not a clone), so IDs stay unique and listeners/state survive.
import { isViewMode, setViewMode } from "../store/viewModeState.js";
import { t } from "../localization/pt-BR/index.js";

const BTN_ID = "view-mode-btn";
const PANEL_ID = "tab-char-resume";
const TARGET_ID = "view-mode-resume";
const EDIT_HOST_ID = "resume-panel-host";
const BODY_CLASS = "is-view-mode";

// appendChild is idempotent when the node is already in the target, so this is
// safe to call on every render cycle without double-move risk.
function _movePanel(viewMode) {
  const panel = document.getElementById(PANEL_ID);
  const target = document.getElementById(viewMode ? TARGET_ID : EDIT_HOST_ID);
  if (!panel || !target) return;
  if (panel.parentElement === target) return; // already in the right place
  target.appendChild(panel);
}

function applyMode(viewMode) {
  document.body.classList.toggle(BODY_CLASS, viewMode);

  const btn = document.getElementById(BTN_ID);
  if (btn) {
    btn.textContent = viewMode ? t("viewMode.btnEdit") : t("viewMode.btnView");
    btn.setAttribute(
      "aria-label",
      viewMode ? t("viewMode.ariaEdit") : t("viewMode.ariaView"),
    );
    btn.setAttribute("aria-pressed", String(viewMode));
  }

  _movePanel(viewMode);
}

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

// Kept for call-site compatibility (engine/index.js) — renderResume() now writes
// directly into the live panel node wherever it lives, so no sync step is needed.
export function syncViewMode() {}
