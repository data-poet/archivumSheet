// initNav() must run before initGroupNav(), which scopes the sidebar to the active group.
import { LABELS } from "../localization/pt-BR/index.js";
import { scrollToSection } from "../shared/motion.js";
import { fetchAppInfo } from "../api.js";

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

// Desktop-only by inheritance: .l-sidebar itself is display:none below the 768px
// breakpoint, so this never needs its own media query.
function _renderSidebarVersion() {
  const nav = document.getElementById("sidebar");
  if (!nav) return;

  const span = document.createElement("span");
  span.className = "sidebar-version";
  nav.appendChild(span);

  fetchAppInfo()
    .then(({ version }) => {
      span.textContent = `v${version}`;
    })
    .catch(() => {
      span.remove();
    });
}

function _initActiveHighlight() {
  function setActiveNav(sectionId) {
    document
      .querySelectorAll(".sidebar-link")
      .forEach((l) =>
        l.classList.toggle("is-active", l.dataset.section === sectionId),
      );
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".sidebar-link");
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.dataset.section);
    if (target) scrollToSection(target);
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

export function renderSidebarSections(sectionKeys) {
  const keys = new Set(sectionKeys);
  _buildSidebar(LABELS.nav.filter(({ key }) => keys.has(key)));
}

export function initNav() {
  _buildSidebar(LABELS.nav);
  _initActiveHighlight();
  _renderSidebarVersion();
}
