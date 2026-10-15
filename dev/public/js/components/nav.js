// initNav() must run before initGroupNav(), which scopes the sidebar to the active group.
// The sheet uses the defaults; the reference page passes its own sections and labels.
import { LABELS } from "../localization/pt-BR/index.js";
import { scrollToSection } from "../shared/motion.js";
import { fetchAppInfo } from "../api.js";
import { LAYOUT_SECTIONS } from "../layout/sheetLayout.js";
import { icon } from "../shared/icons.js";

function _buildSidebar(sections, labels) {
  const nav = document.getElementById("sidebar");
  if (!nav) return;

  const ul = nav.querySelector(".sidebar-nav") ?? document.createElement("ul");
  ul.innerHTML = sections
    .map(({ id, accent, icon: iconName }, i) => {
      const { label } = labels[id] ?? {};
      return `
      <li>
        <a
          href="#${id}"
          class="sidebar-link${i === 0 ? " is-active" : ""}"
          data-section="${id}"
          ${accent ? `data-accent="${accent}"` : ""}
        >
          <span class="sidebar-icon" aria-hidden="true">${icon(iconName)}</span>
          <span class="sidebar-label">${label ?? ""}</span>
        </a>
      </li>`;
    })
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

export function renderSidebarSections(sections, labels = LABELS.nav.sections) {
  _buildSidebar(sections, labels);
}

export function initNav({
  sections = LAYOUT_SECTIONS,
  labels = LABELS.nav.sections,
} = {}) {
  _buildSidebar(sections, labels);
  _initActiveHighlight();
  _renderSidebarVersion();
}
