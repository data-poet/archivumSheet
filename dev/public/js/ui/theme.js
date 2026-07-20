/**
 * theme.js
 *
 * Controls the app-level Light ↔ Dark theme toggle.
 *
 * Resolution order:
 *   1. User's manual choice (themeState.js, localStorage) — sticky, wins
 *      over everything once set.
 *   2. OS-level preference (`prefers-color-scheme`) — followed live: if the
 *      user never manually chose a theme, switching the OS theme while the
 *      app is open updates the app immediately.
 *
 * The resolved theme is written to `data-theme` on <html>. A blocking
 * inline script in <head> (see index.html / reference.html) already sets
 * this attribute before first paint to avoid a flash of the wrong theme;
 * initTheme() re-applies it (cheap, idempotent) and wires the toggle button
 * plus the live system-preference listener.
 *
 * The toggle button (#theme-toggle-btn) lives in the topbar.
 *
 * Public API:
 *   initTheme() — call once from main.js (or reference/main.js) at startup.
 */

import { getTheme, setTheme } from "../store/themeState.js";
import { t } from "../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BTN_ID = "theme-toggle-btn";
const HTML_ATTR = "data-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {"light"|"dark"} the theme currently in effect, combining the
 * user's manual choice (if any) with the system preference.
 */
function resolveTheme() {
  const manual = getTheme();
  if (manual) return manual;
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

/**
 * Writes the theme to <html data-theme="..."> and updates the toggle button.
 * @param {"light"|"dark"} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute(HTML_ATTR, theme);

  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  btn.textContent = theme === "dark" ? t("theme.iconDark") : t("theme.iconLight");
  btn.setAttribute(
    "aria-label",
    theme === "dark" ? t("theme.ariaDark") : t("theme.ariaLight"),
  );
  btn.setAttribute("aria-pressed", String(theme === "dark"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called once from main.js.
 * Applies the resolved theme, wires the toggle button, and keeps the app in
 * sync with OS-level theme changes for as long as the user hasn't manually
 * overridden it.
 */
export function initTheme() {
  applyTheme(resolveTheme());

  const btn = document.getElementById(BTN_ID);
  if (btn) {
    btn.addEventListener("click", () => {
      const next = resolveTheme() === "dark" ? "light" : "dark";
      setTheme(next);
      applyTheme(next);
    });
  }

  // Live-follow the OS preference only while there's no manual override.
  window.matchMedia(SYSTEM_QUERY).addEventListener("change", (event) => {
    if (getTheme()) return; // user has pinned a theme — ignore system changes
    applyTheme(event.matches ? "dark" : "light");
  });
}
