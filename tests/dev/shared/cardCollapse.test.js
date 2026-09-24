import { initCardCollapse } from "dev/public/js/shared/cardCollapse.js";

function row(html) {
  document.body.innerHTML = `
    <table><tbody>
      <tr data-id="ITEM-1">
        <td class="col-title">
          <button class="card-toggle" type="button" aria-expanded="false">
            <span class="card-title-text">Espada</span>
            <span class="card-collapse-arrow">›</span>
          </button>
        </td>
        <td>Attr</td>
      </tr>
    </tbody></table>
    ${html ?? ""}
  `;
  return document.querySelector("tr");
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("initCardCollapse", () => {
  test("clicking the toggle expands the row and flips aria-expanded", () => {
    const tr = row();
    initCardCollapse();

    tr.querySelector(".card-toggle").click();

    expect(tr.classList.contains("is-card-expanded")).toBe(true);
    expect(tr.querySelector(".card-toggle").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  test("clicking again collapses it back", () => {
    const tr = row();
    initCardCollapse();
    const toggle = tr.querySelector(".card-toggle");

    toggle.click();
    toggle.click();

    expect(tr.classList.contains("is-card-expanded")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("clicking elsewhere in the row does nothing", () => {
    const tr = row();
    initCardCollapse();

    tr.querySelectorAll("td")[1].click();

    expect(tr.classList.contains("is-card-expanded")).toBe(false);
  });

  test("clicking inside the title text (a descendant of the toggle) still works", () => {
    const tr = row();
    initCardCollapse();

    tr.querySelector(".card-title-text").click();

    expect(tr.classList.contains("is-card-expanded")).toBe(true);
  });

  test("calling initCardCollapse twice does not double-bind the listener", () => {
    const tr = row();
    initCardCollapse();
    initCardCollapse();

    tr.querySelector(".card-toggle").click();

    // A double-bound listener would toggle twice per click, ending back at collapsed.
    expect(tr.classList.contains("is-card-expanded")).toBe(true);
  });
});
