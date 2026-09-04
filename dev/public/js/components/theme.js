// Manual choice (themeState.js) wins once set; otherwise follows prefers-color-scheme live.
// A blocking inline script in <head> already sets data-theme before first paint to avoid a
// flash of the wrong theme — initTheme() just re-applies it (cheap, idempotent).
import { getTheme, setTheme } from "../store/themeState.js";
import { t } from "../localization/pt-BR/index.js";

const BTN_ID = "theme-toggle-btn";
const HTML_ATTR = "data-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function resolveTheme() {
  const manual = getTheme();
  if (manual) return manual;
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute(HTML_ATTR, theme);

  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  btn.textContent =
    theme === "dark" ? t("theme.iconDark") : t("theme.iconLight");
  btn.setAttribute(
    "aria-label",
    theme === "dark" ? t("theme.ariaDark") : t("theme.ariaLight"),
  );
  btn.setAttribute("aria-pressed", String(theme === "dark"));
}

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

  window.matchMedia(SYSTEM_QUERY).addEventListener("change", (event) => {
    if (getTheme()) return; // user has pinned a theme — ignore system changes
    applyTheme(event.matches ? "dark" : "light");
  });
}
