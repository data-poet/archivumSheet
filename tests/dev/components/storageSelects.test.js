import {
  populateStorageSelects,
  storageValuesFor,
  STORAGE_SELECTS,
  EQUIP_SECTION_PREFIXES,
} from "dev/public/js/components/storageSelects.js";
import { STORAGE_LABELS } from "dev/public/js/shared/constants.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function renderAllSelects() {
  resetDOM(
    STORAGE_SELECTS.map(({ id }) => `<select id="${id}"></select>`).join(""),
  );
}

beforeEach(() => {
  resetDOM();
});

describe("storageValuesFor", () => {
  test("an equippable section offers equipped first, then the storage locations", () => {
    expect(storageValuesFor(true)).toEqual([
      "equipped",
      "backpack",
      "stash",
      "camp",
    ]);
  });

  test("a non-equippable section offers only the storage locations", () => {
    expect(storageValuesFor(false)).toEqual(["backpack", "stash", "camp"]);
  });
});

describe("populateStorageSelects", () => {
  test("fills every descriptor's select with localized options", () => {
    renderAllSelects();

    populateStorageSelects();

    STORAGE_SELECTS.forEach(({ id, equippable }) => {
      const select = document.getElementById(id);
      const expected = storageValuesFor(equippable);
      expect([...select.options].map((o) => o.value)).toEqual(expected);
      expect([...select.options].map((o) => o.textContent)).toEqual(
        expected.map((v) => STORAGE_LABELS[v]),
      );
    });
  });

  test("equippable sections get four options, the rest three", () => {
    renderAllSelects();

    populateStorageSelects();

    const counts = STORAGE_SELECTS.map(({ id }) => ({
      id,
      n: document.getElementById(id).options.length,
    }));
    const equippableIds = STORAGE_SELECTS.filter((s) => s.equippable).map(
      (s) => s.id,
    );
    counts.forEach(({ id, n }) =>
      expect(n).toBe(equippableIds.includes(id) ? 4 : 3),
    );
  });

  test("only equippable sections offer 'equipped' — the others must never be equippable from the add form", () => {
    renderAllSelects();

    populateStorageSelects();

    STORAGE_SELECTS.forEach(({ id, equippable }) => {
      const values = [...document.getElementById(id).options].map(
        (o) => o.value,
      );
      expect(values.includes("equipped")).toBe(equippable);
    });
  });

  test("is idempotent — a second call does not duplicate options", () => {
    renderAllSelects();

    populateStorageSelects();
    populateStorageSelects();

    STORAGE_SELECTS.forEach(({ id, equippable }) => {
      expect(document.getElementById(id).options.length).toBe(
        storageValuesFor(equippable).length,
      );
    });
  });

  test("skips descriptors whose select is absent from the page without throwing", () => {
    resetDOM(`<select id="meleeStorage"></select>`);

    expect(() => populateStorageSelects()).not.toThrow();
    expect(document.getElementById("meleeStorage").options.length).toBe(4);
  });
});

// The markup and the descriptors are separate lists that have to agree; these
// pin that agreement so a section added to one and not the other is caught.
describe("descriptors match index.html", () => {
  const html = require("fs").readFileSync("dev/public/index.html", "utf8");

  test("every storage select in the markup has a descriptor", () => {
    const inMarkup = [
      ...html.matchAll(/<select id="(\w*(?:Storage|storage))"/g),
    ].map((m) => m[1]);
    const described = STORAGE_SELECTS.map((s) => s.id);

    expect(inMarkup.sort()).toEqual(described.sort());
  });

  test("every equip-section prefix has both an equipped and a stored summary in the markup", () => {
    EQUIP_SECTION_PREFIXES.forEach((prefix) => {
      expect(html).toContain(`id="sec-${prefix}-equipped"`);
      expect(html).toContain(`id="sec-${prefix}-stored"`);
    });
  });

  test("the markup carries no leftover per-option ids for storage selects", () => {
    expect(html).not.toMatch(
      /id="opt-\w[\w-]*-(equipped|backpack|stash|camp)"/,
    );
  });
});
