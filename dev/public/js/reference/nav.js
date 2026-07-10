/**
 * reference/nav.js
 *
 * Builds the desktop sidebar + mobile bottom nav for the reference page,
 * from LABELS.reference.sections. Mirrors ../ui/nav.js (same markup, same
 * classes, same active-highlight behavior) so the reference page's nav
 * looks and behaves exactly like the main sheet's — just fed by a
 * different list of sections.
 */

import { LABELS } from "../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────────────────────────────────────────

function _buildSidebar(items) {
  const nav = document.getElementById("sidebar");
  if (!nav) return;

  const ul = document.createElement("ul");
  ul.className = "sidebar-nav";
  ul.setAttribute("role", "list");
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

  nav.appendChild(ul);
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
// Active highlight (identical logic to ../ui/nav.js)
// ─────────────────────────────────────────────────────────────────────────────

function _initActiveHighlight() {
  function setActiveNav(sectionId) {
    document
      .querySelectorAll(".sidebar-link, .bottomnav-link")
      .forEach((l) =>
        l.classList.toggle("is-active", l.dataset.section === sectionId),
      );
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".sidebar-link, .bottomnav-link");
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.dataset.section);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(link.dataset.section);
  });

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
 * Build sidebar + bottomnav from LABELS.reference.sections, then wire
 * active-link logic. Call once from reference/main.js, after the section
 * DOM has been built by content.js.
 */
export function initReferenceNav() {
  const items = LABELS.reference.sections;
  _buildSidebar(items);
  _buildBottomNav(items);
  _initActiveHighlight();
}
