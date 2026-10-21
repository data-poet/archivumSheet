// Traits/Skills/Spells cards start collapsed on mobile (see tables.css's
// table-wrapper--stack rules), showing just the name until tapped. State survives each
// section's frequent re-renders via morphHTML's identity tracking (shared/morph.js), which
// preserves .is-card-expanded the same way it preserves an open <details>.

const EXPANDED_CLASS = "is-card-expanded";

let _bound = false;

export function initCardCollapse() {
  if (_bound) return;
  _bound = true;

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".card-toggle");
    if (!toggle) return;

    const row = toggle.closest("tr");
    if (!row) return;

    const expanded = row.classList.toggle(EXPANDED_CLASS);
    toggle.setAttribute("aria-expanded", String(expanded));
  });
}
