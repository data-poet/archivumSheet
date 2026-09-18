// Switches between the app's pages (sheet / allies / reference). Mounted on every page.
//
// Navigation is same-tab and deliberately so: every engine rebuild persists the active
// character (compute/index.js calls saveActiveCharacter), and that writer rebuilds the
// whole payload from the page it runs on. Two live tabs sharing localStorage would race
// and silently drop edits. One live page at a time makes that impossible. The rows stay
// real <a href> elements so ⌘/ctrl-click can still open a deliberate new tab.
//
// The popover reuses the `char-selector-*` classes: those are the app's generic
// popover-list styles, and renaming them is a separate cleanup.

import { LABELS } from "../localization/pt-BR/index.js";

const TRIGGER_ID = "page-selector-btn";
const POPOVER_ID = "page-selector-popover";

function getTrigger() {
  return document.getElementById(TRIGGER_ID);
}

function getPopover() {
  return document.getElementById(POPOVER_ID);
}

function isOpen() {
  return getPopover()?.classList.contains("is-open") ?? false;
}

// Trailing slashes aside, the static server answers "/" with index.html, so each entry
// declares every pathname that counts as itself.
export function getCurrentPage(pathname = window.location.pathname) {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    LABELS.pages.items.find((page) => page.match.includes(normalized)) ?? null
  );
}

export function renderPageSelector() {
  const trigger = getTrigger();
  const popover = getPopover();
  const { items, ariaLabel, triggerAria } = LABELS.pages;
  const current = getCurrentPage();

  if (trigger) {
    trigger.setAttribute("aria-label", triggerAria);
    trigger.setAttribute("title", triggerAria);
    trigger.innerHTML = `
      <span class="topbar-btn-icon" aria-hidden="true">${current?.icon ?? "📋"}</span>
      <span class="page-selector-btn-label">${current?.label ?? ""}</span>
      <span class="page-selector-btn-chevron" aria-hidden="true">⌄</span>
    `;
  }

  if (popover) {
    popover.setAttribute("aria-label", ariaLabel);
    popover.innerHTML = `
      <ul class="char-selector-list">
        ${items
          .map(
            (page) => `
        <li>
          <a href="${page.href}"
             class="char-selector-item${page.key === current?.key ? " is-active" : ""}"
             data-page="${page.key}"
             ${page.key === current?.key ? 'aria-current="page"' : ""}>
            <span class="char-selector-radio" aria-hidden="true">${page.icon}</span>
            <span class="char-selector-item-info">
              <span class="char-selector-item-name">${page.label}</span>
            </span>
          </a>
        </li>`,
          )
          .join("")}
      </ul>
    `;
  }
}

export function openPageSelector() {
  getPopover()?.classList.add("is-open");
  getTrigger()?.setAttribute("aria-expanded", "true");
  getPopover()?.querySelector("a")?.focus();
}

export function closePageSelector({ restoreFocus = false } = {}) {
  getPopover()?.classList.remove("is-open");
  getTrigger()?.setAttribute("aria-expanded", "false");
  if (restoreFocus) getTrigger()?.focus();
}

export function togglePageSelector() {
  if (isOpen()) closePageSelector();
  else openPageSelector();
}

export function initPageSelector() {
  renderPageSelector();

  const trigger = getTrigger();
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePageSelector();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen()) return;
    closePageSelector({ restoreFocus: true });
  });

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (getPopover()?.contains(e.target) || getTrigger()?.contains(e.target)) {
      return;
    }
    closePageSelector();
  });

  // Navigating to the page already open would be a pointless reload, and a reload is
  // never free here — it re-fetches every catalog.
  getPopover()?.addEventListener("click", (e) => {
    const link = e.target.closest("[data-page]");
    if (!link) return;

    if (link.dataset.page === getCurrentPage()?.key) {
      e.preventDefault();
      closePageSelector({ restoreFocus: true });
    }
  });
}
