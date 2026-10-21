import fs from "fs";
import path from "path";
import { morphHTML } from "dev/public/js/shared/morph.js";

// The vendored copy (shared/morph.js's only importer) and the devDependency (what gives jest
// the real library for the behavioural tests below) must be the exact same release, or a test
// passing here would prove nothing about what actually ships. Read directly off disk rather
// than require("idiomorph/package.json") — its own "exports" map doesn't expose that subpath.
test("the vendored idiomorph build matches the pinned devDependency", () => {
  const vendoredVersion = fs
    .readFileSync(
      path.join(__dirname, "../../../dev/public/vendor/idiomorph/VERSION"),
      "utf8",
    )
    .trim();
  const { version } = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../../node_modules/idiomorph/package.json"),
      "utf8",
    ),
  );

  expect(vendoredVersion).toBe(version);
});

describe("morphHTML", () => {
  test("is a no-op when the container doesn't exist", () => {
    expect(() => morphHTML(null, "<p>x</p>")).not.toThrow();
  });

  test("updates content the same as innerHTML would, for a plain change", () => {
    document.body.innerHTML = `<div id="c"><p>old</p></div>`;
    const c = document.getElementById("c");

    morphHTML(c, "<p>new</p>");

    expect(c.textContent).toBe("new");
  });

  test("keeps focus and a mid-typed value on an input the new markup also renders", () => {
    document.body.innerHTML = `
      <div id="c">
        <input id="a" value="1" />
        <input id="b" value="2" />
      </div>`;
    const c = document.getElementById("c");
    const a = document.getElementById("a");
    a.focus();
    a.value = "typing...";

    morphHTML(c, `<input id="a" value="1" /><input id="b" value="3" />`);

    expect(document.activeElement.id).toBe("a");
    expect(document.getElementById("a").value).toBe("typing...");
    expect(document.getElementById("b").value).toBe("3");
  });

  test("keeps focus on the right row when a new row is inserted above it, given stable ids", () => {
    document.body.innerHTML = `
      <table id="c"><tbody>
        <tr id="row-a"><td><input id="input-a" value="0" /></td></tr>
        <tr id="row-b"><td><input id="input-b" value="0" /></td></tr>
      </tbody></table>`;
    const c = document.getElementById("c");
    const inputB = document.getElementById("input-b");
    inputB.focus();
    inputB.value = "typing";

    morphHTML(
      c,
      `<tbody>
        <tr id="row-new"><td><input id="input-new" value="0" /></td></tr>
        <tr id="row-a"><td><input id="input-a" value="0" /></td></tr>
        <tr id="row-b"><td><input id="input-b" value="0" /></td></tr>
      </tbody>`,
    );

    expect(document.activeElement.id).toBe("input-b");
    expect(document.getElementById("input-b").value).toBe("typing");
  });

  // Not a desired behaviour — a regression check that documents exactly the failure mode
  // stable ids exist to prevent, so it doesn't get silently reintroduced.
  test("without stable ids, inserting a row above moves focus onto the wrong row", () => {
    document.body.innerHTML = `
      <table id="c"><tbody>
        <tr><td><input class="x" value="0" /></td></tr>
        <tr><td><input class="y" value="0" /></td></tr>
      </tbody></table>`;
    const c = document.getElementById("c");
    const inputY = c.querySelectorAll("input")[1];
    inputY.focus();

    morphHTML(
      c,
      `<tbody>
        <tr><td><input class="new" value="0" /></td></tr>
        <tr><td><input class="x" value="0" /></td></tr>
        <tr><td><input class="y" value="0" /></td></tr>
      </tbody>`,
    );

    expect(document.activeElement.classList.contains("x")).toBe(true);
  });

  test("keeps an imperatively-opened <details> open across a re-render", () => {
    document.body.innerHTML = `<div id="c"><details id="d"><summary>s</summary>x</details></div>`;
    document.getElementById("d").setAttribute("open", "");

    morphHTML(
      document.getElementById("c"),
      `<details id="d"><summary>s</summary>y</details>`,
    );

    expect(document.getElementById("d").hasAttribute("open")).toBe(true);
  });

  test("keeps an imperatively-added is-card-expanded class across a re-render", () => {
    document.body.innerHTML = `<table id="c"><tbody><tr id="r"><td>a</td></tr></tbody></table>`;
    document.getElementById("r").classList.add("is-card-expanded");

    morphHTML(
      document.getElementById("c"),
      `<tbody><tr id="r"><td>b</td></tr></tbody>`,
    );

    expect(
      document.getElementById("r").classList.contains("is-card-expanded"),
    ).toBe(true);
  });

  // customItemEditRow's <details> is the one exception: its `open` mirrors a store flag
  // (isCustomFieldsEditorOpen), not a user click on the <details> itself, so the new source
  // omitting `open` means "the store says closed" and must be allowed through — unlike every
  // other (imperative) <details>, which the guard above protects instead.
  test("lets a store-driven <details> (data-store-driven-open) close when the new source omits open", () => {
    document.body.innerHTML = `<div id="c"><details id="d" data-store-driven-open open><summary>s</summary>x</details></div>`;

    morphHTML(
      document.getElementById("c"),
      `<details id="d" data-store-driven-open><summary>s</summary>y</details>`,
    );

    expect(document.getElementById("d").hasAttribute("open")).toBe(false);
  });
});
