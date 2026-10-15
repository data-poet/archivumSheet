// Post-render touches on parsed reference markdown, so authors keep writing plain markdown
// (conventions in reference-content/README.md).

const BADGE_SEPARATOR = " | ";
// Cells longer than this mean prose rows, which read better as stacked cards on phones;
// short numeric tables (e.g. the damage table) stay tabular.
const CARD_CELL_CHARS = 80;

// Sibling <details> share a `name`, so the browser keeps at most one of them open.
function _linkAccordions(panel) {
  let group = 0;
  const containers = [
    panel.querySelector(".reference-prose"),
    ...panel.querySelectorAll(".reference-prose details"),
  ].filter(Boolean);

  containers.forEach((container) => {
    const siblings = Array.from(container.children).filter(
      (el) => el.tagName === "DETAILS",
    );
    if (siblings.length < 2) return;
    const name = `${panel.id}-accordion-${group++}`;
    siblings.forEach((details) => details.setAttribute("name", name));
  });
}

// "Título | badge" in a summary renders the badge right-aligned.
function _splitSummaryBadges(panel) {
  panel.querySelectorAll(".reference-prose summary").forEach((summary) => {
    const text = summary.textContent.trim();
    const at = text.indexOf(BADGE_SEPARATOR);
    if (at === -1) return;

    const title = document.createElement("span");
    title.className = "summary-title";
    title.textContent = text.slice(0, at).trim();

    const badge = document.createElement("span");
    badge.className = "summary-badge";
    badge.textContent = text.slice(at + BADGE_SEPARATOR.length).trim();

    summary.replaceChildren(title, badge);
  });
}

function _labelTableCells(panel) {
  panel.querySelectorAll(".reference-prose table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th"), (th) =>
      th.textContent.trim(),
    );
    let hasLongCell = false;

    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, i) => {
        if (headers[i]) cell.dataset.label = headers[i];
        if (cell.textContent.trim().length > CARD_CELL_CHARS)
          hasLongCell = true;
      });
    });

    table.classList.toggle("reference-table--cards", hasLongCell);
  });
}

export function enhanceProse(panel) {
  _linkAccordions(panel);
  _splitSummaryBadges(panel);
  _labelTableCells(panel);
}

// Opening an item closes the open sibling above it, which shifts the page up; bring the
// newly opened summary back into view. `toggle` doesn't bubble, hence the capture listener.
export function initAccordionScroll(root = document) {
  root.addEventListener(
    "toggle",
    (e) => {
      const details = e.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (!details.closest(".reference-prose")) return;

      requestAnimationFrame(() => {
        const summary = details.querySelector(":scope > summary");
        summary?.scrollIntoView?.({ block: "nearest" });
      });
    },
    true,
  );
}
