// Post-render touches on parsed reference markdown, so authors keep writing plain markdown
// (conventions in reference-content/README.md).

const BADGE_SEPARATOR = " | ";

export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
const EXAMPLE_TITLE = /^Exemplos?$/;
// Cells longer than this mean prose rows, which read better as stacked cards on phones;
// short numeric tables (e.g. the damage table) stay tabular.
const CARD_CELL_CHARS = 80;

// "Exemplo" disclosures are the one nesting the conventions allow; they get their own compact
// style and never join an item list.
function _markExamples(panel) {
  panel.querySelectorAll(".reference-prose details").forEach((details) => {
    const title = details.querySelector(":scope > summary")?.textContent.trim();
    if (EXAMPLE_TITLE.test(title ?? ""))
      details.classList.add("reference-example");
  });
}

// Each run of consecutive <details> becomes one boxed list of rows, and its items share a
// `name`, so the browser keeps at most one of them open.
function _groupItemLists(panel) {
  const prose = panel.querySelector(".reference-prose");
  if (!prose) return;

  const runs = [];
  let run = null;
  Array.from(prose.children).forEach((el) => {
    if (
      el.tagName !== "DETAILS" ||
      el.classList.contains("reference-example")
    ) {
      run = null;
      return;
    }
    if (!run) runs.push((run = []));
    run.push(el);
  });

  runs.forEach((items, i) => {
    const list = document.createElement("div");
    list.className = "reference-list";
    items[0].before(list);
    items.forEach((details) => {
      if (items.length > 1)
        details.setAttribute("name", `${panel.id}-list-${i}`);
      list.appendChild(details);
    });
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

// Stable ids for deep links and search: "<tab id>--<slug of the title>", e.g.
// tab-attr-secondary--pontos-de-vida-pv. Runs after badges are split, so only the title counts.
function _assignAnchors(panel) {
  const used = new Set();
  const targets = panel.querySelectorAll(
    ".reference-prose h3, .reference-prose details:not(.reference-example)",
  );
  targets.forEach((el) => {
    const label =
      el.tagName === "DETAILS"
        ? (
            el.querySelector(":scope > summary .summary-title") ??
            el.querySelector(":scope > summary")
          )?.textContent
        : el.textContent;
    const base = `${panel.id}--${slugify(label ?? "")}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    el.id = id;
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
  _markExamples(panel);
  _groupItemLists(panel);
  _splitSummaryBadges(panel);
  _assignAnchors(panel);
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
