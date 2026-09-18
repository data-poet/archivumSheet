jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveKind: jest.fn(() => "character"),
  setActiveKind: jest.fn(),
}));

import {
  getActiveKind,
  setActiveKind,
} from "dev/public/js/store/characters.js";
import {
  initEntryKind,
  renderEntryKind,
} from "dev/public/js/components/entryKind.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<div id="entry-kind"></div>`);
  document.body.classList.remove("is-ally-draft");
  jest.clearAllMocks();
  getActiveKind.mockReturnValue("character");
});

describe("renderEntryKind", () => {
  test("offers exactly two mutually exclusive options", () => {
    renderEntryKind();

    const radios = document.querySelectorAll('input[name="entry-kind"]');
    expect([...radios].map((r) => r.value)).toEqual(["character", "ally"]);
  });

  test("checks the active entry's kind", () => {
    getActiveKind.mockReturnValue("ally");

    renderEntryKind();

    expect(document.querySelector('input[value="ally"]').checked).toBe(true);
    expect(document.querySelector('input[value="character"]').checked).toBe(
      false,
    );
  });

  // The radio scrolls out of view; the body class drives the topbar treatment that does not.
  test("marks the body only while a draft is active", () => {
    getActiveKind.mockReturnValue("ally");
    renderEntryKind();
    expect(document.body.classList.contains("is-ally-draft")).toBe(true);

    getActiveKind.mockReturnValue("character");
    renderEntryKind();
    expect(document.body.classList.contains("is-ally-draft")).toBe(false);
  });

  // Pages without the control (reference, allies) still call this for the body class.
  test("sets the body class even when the host is absent", () => {
    resetDOM();
    getActiveKind.mockReturnValue("ally");

    expect(() => renderEntryKind()).not.toThrow();
    expect(document.body.classList.contains("is-ally-draft")).toBe(true);
  });
});

describe("initEntryKind", () => {
  test("choosing ally persists the kind on the active entry", () => {
    initEntryKind();

    const allyRadio = document.querySelector('input[value="ally"]');
    allyRadio.checked = true;
    allyRadio.dispatchEvent(new Event("change", { bubbles: true }));

    expect(setActiveKind).toHaveBeenCalledWith("ally");
  });

  test("choosing character persists too", () => {
    getActiveKind.mockReturnValue("ally");
    initEntryKind();

    const charRadio = document.querySelector('input[value="character"]');
    charRadio.checked = true;
    charRadio.dispatchEvent(new Event("change", { bubbles: true }));

    expect(setActiveKind).toHaveBeenCalledWith("character");
  });

  test("re-renders after a change so the body class follows immediately", () => {
    initEntryKind();
    getActiveKind.mockReturnValue("ally");

    const allyRadio = document.querySelector('input[value="ally"]');
    allyRadio.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.body.classList.contains("is-ally-draft")).toBe(true);
  });

  test("ignores changes from unrelated inputs", () => {
    initEntryKind();
    const stray = document.createElement("input");
    document.getElementById("entry-kind").appendChild(stray);

    stray.dispatchEvent(new Event("change", { bubbles: true }));

    expect(setActiveKind).not.toHaveBeenCalled();
  });
});
