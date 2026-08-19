/**
 * nav.js
 *
 * Generates and initialises both navigation bars (sidebar + bottomnav)
 * from the single `nav` array in the localization file.
 *
 * Call initNav() once from main.js, before initTabs().
 *
 * The active-link highlight logic (scroll + click) that was previously
 * inlined in index.html is moved here so it works for both dynamically
 * generated nav elements.
 */

import { LABELS } from "../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────────────────────────────────────────

function _buildSidebar(items) {
  const nav = document.getElementById("sidebar");
  if (!nav) return;

  const ul = nav.querySelector(".sidebar-nav") ?? document.createElement("ul");
  ul.innerHTML = items
    .map(
      ({ key, label, icon }, i) => `
      <li>
        <a
          href="#${key}"
          class="sidebar-link${i === 0 ? " is-active" : ""}"
          data-section="${key}"
        >
          <span class="sidebar-icon" aria-hidden="true">${icon}</span>
          <span class="sidebar-label">${label}</span>
        </a>
      </li>`,
    )
    .join("");

  if (!nav.querySelector(".sidebar-nav")) {
    ul.className = "sidebar-nav";
    ul.setAttribute("role", "list");
    nav.appendChild(ul);
  }
}

function _buildBottomNav(items) {
  const nav = document.getElementById("bottomnav");
  if (!nav) return;

  nav.innerHTML = items
    .map(
      ({ key, label, icon }, i) => `
      <a
        href="#${key}"
        class="bottomnav-link${i === 0 ? " is-active" : ""}"
        data-section="${key}"
      >
        <span class="bottomnav-icon" aria-hidden="true">${icon}</span>
        <span>${label}</span>
      </a>`,
    )
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Active highlight (replaces inline script in index.html)
// ─────────────────────────────────────────────────────────────────────────────

function _initActiveHighlight() {
  function setActiveNav(sectionId) {
    document
      .querySelectorAll(".sidebar-link, .bottomnav-link")
      .forEach((l) =>
        l.classList.toggle("is-active", l.dataset.section === sectionId),
      );
  }

  // Click: smooth scroll + instant highlight
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".sidebar-link, .bottomnav-link");
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.dataset.section);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(link.dataset.section);
  });

  // Scroll: IntersectionObserver highlights nav as sections enter view
  const sections = document.querySelectorAll(".l-section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    },
    { threshold: 0.25 },
  );
  sections.forEach((s) => observer.observe(s));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build sidebar + bottomnav from LABELS.nav, then wire active-link logic.
 * Call once from main.js before initTabs().
 */
export function initNav() {
  const items = LABELS.nav;
  _buildSidebar(items);
  _buildBottomNav(items);
  _initActiveHighlight();
}
