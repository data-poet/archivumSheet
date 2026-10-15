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

describe("enhanceProse — item lists", () => {
  test("wraps each run of details in its own list, sharing a name per run", () => {
    const panel = panelWith(`
      <h3>A</h3>${item("a1")}${item("a2")}
      <h3>B</h3>${item("b1")}${item("b2")}
      <p>texto</p>${item("solo")}`);
    enhanceProse(panel);

    const lists = panel.querySelectorAll(".reference-prose > .reference-list");
    expect(lists).toHaveLength(3);
    const [a, b, solo] = Array.from(lists, (list) =>
      Array.from(list.children, (d) => d.getAttribute("name")),
    );
    expect(a[0]).toBe(a[1]);
    expect(b[0]).toBe(b[1]);
    expect(a[0]).not.toBe(b[0]);
    expect(solo).toEqual([null]);
    expect(lists[0].previousElementSibling.tagName).toBe("H3");
  });

  test("Exemplo disclosures get their own class and stay out of item lists", () => {
    const panel = panelWith(
      `<p>texto</p>${item("Exemplo")}${item("a")}<details><summary>b</summary>${item("Exemplos")}</details>`,
    );
    enhanceProse(panel);

    const examples = panel.querySelectorAll(".reference-example");
    expect(
      Array.from(examples, (d) => d.querySelector("summary").textContent),
    ).toEqual(["Exemplo", "Exemplos"]);
    expect(examples[0].parentElement.classList.contains("reference-list")).toBe(
      false,
    );
    const list = panel.querySelector(".reference-list");
    expect(
      Array.from(list.children, (d) => d.querySelector("summary").textContent),
    ).toEqual(["a", "b"]);
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
