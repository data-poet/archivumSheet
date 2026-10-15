jest.mock("dev/public/js/components/groupNav.js", () => ({
  activateGroup: jest.fn(),
}));
jest.mock("dev/public/js/components/tabs.js", () => ({
  openSection: jest.fn(),
}));

import { activateGroup } from "dev/public/js/components/groupNav.js";
import { openSection } from "dev/public/js/components/tabs.js";
import {
  revealAnchor,
  initDeepLinks,
} from "dev/public/js/reference/deepLink.js";
import { REFERENCE_LAYOUT } from "dev/public/js/reference/referenceLayout.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const { group, sections } = REFERENCE_LAYOUT[1];
const section = sections[0];
const tab = section.tabs[0];

beforeEach(() => {
  resetDOM();
  jest.clearAllMocks();
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => cb());
  Element.prototype.scrollIntoView = jest.fn();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<section id="${section.id}" class="l-section"><div class="tab-panel" id="${tab.id}">
      <div class="reference-prose"><div class="reference-list">
        <details id="${tab.id}--item"><summary>Item</summary><p>…</p></details>
      </div></div></div></section>`,
  );
});

describe("revealAnchor", () => {
  test("activates the group, opens the section on the tab, opens the item and scrolls to its summary", () => {
    expect(revealAnchor(`${tab.id}--item`)).toBe(true);

    expect(activateGroup).toHaveBeenCalledWith(group);
    expect(openSection).toHaveBeenCalledWith(section.id, tab.id);
    const details = document.getElementById(`${tab.id}--item`);
    expect(details.open).toBe(true);
    expect(details.querySelector("summary").scrollIntoView).toHaveBeenCalled();
  });

  test("a tab id scrolls to its section", () => {
    revealAnchor(tab.id);

    expect(openSection).toHaveBeenCalledWith(section.id, tab.id);
    expect(
      document.getElementById(section.id).scrollIntoView,
    ).toHaveBeenCalled();
  });

  test("unknown or empty ids do nothing", () => {
    expect(revealAnchor("nope")).toBe(false);
    expect(revealAnchor("")).toBe(false);
    expect(activateGroup).not.toHaveBeenCalled();
  });
});

describe("initDeepLinks", () => {
  test("reveals the current hash and follows hash changes", () => {
    window.location.hash = `#${tab.id}--item`;
    initDeepLinks();
    expect(openSection).toHaveBeenCalledTimes(1);

    window.location.hash = `#${tab.id}`;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(openSection).toHaveBeenCalledTimes(2);
    window.location.hash = "";
  });
});
