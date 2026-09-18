// Both selectors sit in the topbar and both popovers are position:fixed at the same spot with
// the same z-index, so two open at once is not merely untidy — the later one in the DOM covers
// the other, and clicking a trigger looks like it did nothing.
//
// Neither component's own suite mounts the other, which is exactly why the interaction broke:
// each behaved correctly alone.
jest.mock("dev/public/js/store/characters.js", () => ({
  listCharacters: jest.fn(() => [
    { id: "c1", name: "Kael", race: "Humano", kind: "character" },
  ]),
  getActiveCharacterId: jest.fn(() => "c1"),
  getActiveKind: jest.fn(() => "character"),
  loadCharacter: jest.fn(),
  addCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  saveActiveCharacter: jest.fn(),
  replaceActiveCharacter: jest.fn(),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  exportSheet: jest.fn(),
  exportAllySheet: jest.fn(),
  importSheet: jest.fn(),
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/components/entryKind.js", () => ({
  renderEntryKind: jest.fn(),
  warnAllyOnlyContent: jest.fn(),
}));
jest.mock("dev/public/js/components/dialog.js", () => ({
  showConfirm: jest.fn(),
}));

import { initCharacterSelector } from "dev/public/js/components/characterSelector.js";
import { initPageSelector } from "dev/public/js/components/pageSelector.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const TOPBAR = `
  <button id="page-selector-btn" aria-expanded="false"></button>
  <button id="char-selector-btn" aria-expanded="false"></button>
  <div id="page-selector-popover" class="char-selector-popover"></div>
  <div id="char-selector-popover" class="char-selector-popover"></div>
`;

const isOpen = (id) =>
  document.getElementById(id).classList.contains("is-open");

const pagePopover = () => isOpen("page-selector-popover");
const charPopover = () => isOpen("char-selector-popover");

function click(id) {
  document
    .getElementById(id)
    .dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
}

beforeEach(() => {
  resetDOM(TOPBAR);
  window.history.pushState({}, "", "/");
  initCharacterSelector();
  initPageSelector();
});

test("only one selector is open at a time", () => {
  click("char-selector-btn");
  expect(charPopover()).toBe(true);

  click("page-selector-btn");

  expect(pagePopover()).toBe(true);
  expect(charPopover()).toBe(false);
});

test("and the other way round", () => {
  click("page-selector-btn");
  expect(pagePopover()).toBe(true);

  click("char-selector-btn");

  expect(charPopover()).toBe(true);
  expect(pagePopover()).toBe(false);
});

test("aria-expanded follows on both, not just the one that opened", () => {
  click("char-selector-btn");
  click("page-selector-btn");

  expect(
    document.getElementById("char-selector-btn").getAttribute("aria-expanded"),
  ).toBe("false");
  expect(
    document.getElementById("page-selector-btn").getAttribute("aria-expanded"),
  ).toBe("true");
});

// The guard that replaced stopPropagation: a trigger's own click reaches document, so it must
// not close what it just opened.
test("a trigger does not close its own popover on the way up", () => {
  click("page-selector-btn");
  expect(pagePopover()).toBe(true);

  click("char-selector-btn");
  expect(charPopover()).toBe(true);
});

test("clicking a trigger twice still toggles it shut", () => {
  click("char-selector-btn");
  click("char-selector-btn");

  expect(charPopover()).toBe(false);
});

test("a click elsewhere closes whichever is open", () => {
  click("page-selector-btn");

  document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(pagePopover()).toBe(false);
  expect(charPopover()).toBe(false);
});
