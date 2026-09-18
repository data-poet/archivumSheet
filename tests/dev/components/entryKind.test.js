jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveKind: jest.fn(() => "character"),
  setActiveKind: jest.fn(),
  saveActiveCharacter: jest.fn(),
}));
jest.mock("dev/public/js/shared/availability.js", () => ({
  audienceAffectsCatalogs: jest.fn(() => false),
}));
jest.mock("dev/public/js/shared/navigation.js", () => ({
  reloadPage: jest.fn(),
}));
jest.mock("dev/public/js/store/allyOnlyContent.js", () => ({
  findAllyOnlyContent: jest.fn(() => []),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  showToast: jest.fn(),
}));

import {
  getActiveKind,
  setActiveKind,
  saveActiveCharacter,
} from "dev/public/js/store/characters.js";
import { audienceAffectsCatalogs } from "dev/public/js/shared/availability.js";
import { reloadPage } from "dev/public/js/shared/navigation.js";
import { findAllyOnlyContent } from "dev/public/js/store/allyOnlyContent.js";
import { showToast } from "dev/public/js/store/persistence.js";
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
  audienceAffectsCatalogs.mockReturnValue(false);
  findAllyOnlyContent.mockReturnValue([]);
});

function chooseKind(value) {
  const radio = document.querySelector(`input[value="${value}"]`);
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}

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

// The catalogs a page sees are fixed before the first fetch, so a kind change cannot take
// effect in place — but reloading is pointless while every audience sees the same rows.
describe("reloading on a kind change", () => {
  test("does not reload while no catalog row declares an availability", () => {
    initEntryKind();

    chooseKind("ally");

    expect(setActiveKind).toHaveBeenCalledWith("ally");
    expect(reloadPage).not.toHaveBeenCalled();
    expect(saveActiveCharacter).not.toHaveBeenCalled();
  });

  test("reloads once the audiences can diverge", () => {
    audienceAffectsCatalogs.mockReturnValue(true);
    initEntryKind();

    chooseKind("ally");

    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  // Autosave is debounced 300ms, so the reload would otherwise discard the last edit.
  test("saves before reloading, not after", () => {
    audienceAffectsCatalogs.mockReturnValue(true);
    const order = [];
    saveActiveCharacter.mockImplementation(() => order.push("save"));
    reloadPage.mockImplementation(() => order.push("reload"));
    initEntryKind();

    chooseKind("ally");

    expect(order).toEqual(["save", "reload"]);
  });

  test("persists the kind before reloading, so the new audience is read from it", () => {
    audienceAffectsCatalogs.mockReturnValue(true);
    const order = [];
    setActiveKind.mockImplementation(() => order.push("setKind"));
    reloadPage.mockImplementation(() => order.push("reload"));
    initEntryKind();

    chooseKind("ally");

    expect(order).toEqual(["setKind", "reload"]);
  });
});

// Reported, not blocked: the engine resolves the content either way, so this is a rules
// problem for the player to judge rather than a broken sheet.
describe("the ally-only content backstop", () => {
  test("warns when a draft holding ally-only content becomes a character", () => {
    getActiveKind.mockReturnValue("ally");
    findAllyOnlyContent.mockReturnValue([
      { id: "ADV-ALLY-1", label: "Corpo Elemental" },
    ]);
    initEntryKind();

    chooseKind("character");

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toContain("Corpo Elemental");
    expect(showToast.mock.calls[0][1]).toBe("error");
  });

  test("stays quiet when the draft holds nothing ally-only", () => {
    getActiveKind.mockReturnValue("ally");
    initEntryKind();

    chooseKind("character");

    expect(showToast).not.toHaveBeenCalled();
  });

  // Going the other way is always fine — an ally may hold anything.
  test("does not warn when a character becomes a draft", () => {
    findAllyOnlyContent.mockReturnValue([
      { id: "ADV-ALLY-1", label: "Corpo Elemental" },
    ]);
    initEntryKind();

    chooseKind("ally");

    expect(showToast).not.toHaveBeenCalled();
  });
});
