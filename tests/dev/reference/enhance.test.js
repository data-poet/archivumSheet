import {
  enhanceProse,
  initAccordionScroll,
} from "dev/public/js/reference/enhance.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function panelWith(html) {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="tab-panel" id="tab-x"><div class="reference-prose">${html}</div></div>`,
  );
  return document.getElementById("tab-x");
}

const item = (title) =>
  `<details><summary>${title}</summary><p>…</p></details>`;

beforeEach(() => resetDOM());

describe("enhanceProse — accordions", () => {
  test("siblings at each level share a name per container; a lone details gets none", () => {
    const panel = panelWith(`
      <details><summary>G1</summary>${item("a")}${item("b")}</details>
      <details><summary>G2</summary>${item("c")}</details>`);
    enhanceProse(panel);

    const [g1, g2] = panel.querySelectorAll(".reference-prose > details");
    const [a, b] = g1.querySelectorAll(":scope > details");
    expect(g1.getAttribute("name")).toBe(g2.getAttribute("name"));
    expect(a.getAttribute("name")).toBe(b.getAttribute("name"));
    expect(a.getAttribute("name")).not.toBe(g1.getAttribute("name"));
    expect(g2.querySelector("details").hasAttribute("name")).toBe(false);
  });
});

describe("enhanceProse — summary badges", () => {
  test("splits 'Título | badge' into title and badge spans", () => {
    const panel = panelWith(
      item("Tronco (Torso) | Redutor: 0") + item("Sem badge"),
    );
    enhanceProse(panel);

    const [withBadge, plain] = panel.querySelectorAll("summary");
    expect(withBadge.querySelector(".summary-title").textContent).toBe(
      "Tronco (Torso)",
    );
    expect(withBadge.querySelector(".summary-badge").textContent).toBe(
      "Redutor: 0",
    );
    expect(plain.querySelector(".summary-badge")).toBeNull();
    expect(plain.textContent).toBe("Sem badge");
  });
});

describe("enhanceProse — tables", () => {
  const table = (cell) => `
    <table><thead><tr><th>3d6</th><th>Descrição</th></tr></thead>
    <tbody><tr><td>3</td><td>${cell}</td></tr></tbody></table>`;

  test("labels each cell with its header and flags long-text tables as cards", () => {
    const panel = panelWith(table("x".repeat(81)));
    enhanceProse(panel);

    const cells = panel.querySelectorAll("td");
    expect(cells[0].dataset.label).toBe("3d6");
    expect(cells[1].dataset.label).toBe("Descrição");
    expect(
      panel.querySelector("table").classList.contains("reference-table--cards"),
    ).toBe(true);
  });

  test("short tables stay tabular", () => {
    const panel = panelWith(table("1d6-2"));
    enhanceProse(panel);

    expect(
      panel.querySelector("table").classList.contains("reference-table--cards"),
    ).toBe(false);
  });
});

describe("initAccordionScroll", () => {
  beforeEach(() => {
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => cb());
  });

  test("brings an opened reference item's summary into view", () => {
    const panel = panelWith(item("a"));
    const summary = panel.querySelector("summary");
    summary.scrollIntoView = jest.fn();
    initAccordionScroll(panel);

    const details = panel.querySelector("details");
    details.open = true;
    details.dispatchEvent(new Event("toggle"));

    expect(summary.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  test("ignores closing", () => {
    const panel = panelWith(item("a"));
    const summary = panel.querySelector("summary");
    summary.scrollIntoView = jest.fn();
    initAccordionScroll(panel);

    panel.querySelector("details").dispatchEvent(new Event("toggle"));

    expect(summary.scrollIntoView).not.toHaveBeenCalled();
  });
});
