// Covers the render paths that interpolate user-typed text straight into innerHTML.
// Equipment custom fields already route through customFieldsBody/customItemEditRow
// (escaped in renderUtils.js); these are the sites that render such text outside
// those helpers, where a "<" used to corrupt the markup.
//
// Threat model is self-only today — data is local, nothing is shared — so this is
// primarily a robustness guarantee. It becomes a real XSS boundary the moment
// character sharing or import-from-URL ships, and the import path already accepts
// arbitrary JSON.

import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const HOSTILE = `<img src=x onerror=alert(1)>`;

beforeEach(() => {
  resetDOM();
  resetState();
});

describe("custom inventory name", () => {
  test("a hostile item name renders as inert text, injecting no element", async () => {
    const { renderCustomInventory } =
      await import("dev/public/js/engine/inventory/customInventory/render.js");
    resetDOM(`<div id="customInventoryList"></div>`);
    state.selected.customInventory = [
      {
        id: "CUSTOM-1",
        name: HOSTILE,
        quantity: 1,
        weight: 0,
        price: 0,
        storedAt: "backpack",
      },
    ];

    renderCustomInventory(state.selected, state.data, undefined);

    const list = document.getElementById("customInventoryList");
    expect(list.querySelector("img")).toBeNull();
    expect(list.textContent).toContain(HOSTILE);
  });
});

describe("character selector", () => {
  test("a hostile character name renders as inert text in the button and the popover", async () => {
    const characters = await import("dev/public/js/store/characters.js");
    const characterLinking =
      await import("dev/public/js/store/allies/characterLinking.js");
    const { updateSelectorButton, renderPopover } =
      await import("dev/public/js/components/characterSelector.js");

    resetDOM(`
      <button id="char-selector-btn"></button>
      <div id="char-selector-popover"></div>
    `);

    jest
      .spyOn(characters, "listCharacters")
      .mockReturnValue([{ id: "c-1", name: HOSTILE, race: HOSTILE }]);
    jest
      .spyOn(characterLinking, "listCharactersGrouped")
      .mockReturnValue([{ id: "c-1", name: HOSTILE, race: HOSTILE }]);
    jest.spyOn(characters, "getActiveCharacterId").mockReturnValue("c-1");

    updateSelectorButton();
    renderPopover();

    const btn = document.getElementById("char-selector-btn");
    const popover = document.getElementById("char-selector-popover");
    expect(btn.querySelector("img")).toBeNull();
    expect(popover.querySelector("img")).toBeNull();
    expect(btn.textContent).toContain(HOSTILE);
    expect(popover.textContent).toContain(HOSTILE);

    jest.restoreAllMocks();
  });
});

describe("resume portrait", () => {
  test("a hostile image src from an imported sheet cannot break out of the attribute", async () => {
    const { renderResumeImage } =
      await import("dev/public/js/engine/character/portrait/portrait.js");
    resetDOM(`<div id="resume-charimg-wrapper"></div>`);

    state.selected.character.image = {
      uploaded: true,
      data: `x" onerror="alert(1)`,
      background: "black",
      color: { r: 0, g: 0, b: 0 },
      position: { x: 50, y: 50 },
      size: { width: "", height: "" },
      scale: 100,
    };

    renderResumeImage();

    const img = document.getElementById("resume-charimg-img");
    expect(img).not.toBeNull();
    // The whole hostile string landed in src as data, and no onerror attribute exists.
    expect(img.getAttribute("src")).toBe(`x" onerror="alert(1)`);
    expect(img.hasAttribute("onerror")).toBe(false);
  });

  test("valid numeric scale/position still reach the style attribute unchanged", async () => {
    const { renderResumeImage } =
      await import("dev/public/js/engine/character/portrait/portrait.js");
    resetDOM(`<div id="resume-charimg-wrapper"></div>`);

    state.selected.character.image = {
      uploaded: true,
      data: "data:image/png;base64,AAAA",
      background: "average",
      color: { r: 10, g: 20, b: 30 },
      position: { x: 25, y: 75 },
      size: { width: "", height: "" },
      scale: 140,
    };

    renderResumeImage();

    const img = document.getElementById("resume-charimg-img");
    expect(img.style.width).toBe("140%");
    expect(img.style.left).toBe("25%");
    expect(img.style.top).toBe("75%");
    expect(
      document.getElementById("resume-charimg-bg").style.backgroundColor,
    ).toBe("rgb(10, 20, 30)");
  });
});
