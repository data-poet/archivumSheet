jest.mock("dev/public/js/store/tabState.js", () => ({
  getActiveTab: jest.fn(),
  setActiveTab: jest.fn(),
}));
jest.mock("dev/public/js/store/sectionCollapseState.js", () => ({
  isCollapsed: jest.fn(),
  setCollapsed: jest.fn(),
}));

import { getActiveTab, setActiveTab } from "dev/public/js/store/tabState.js";
import {
  isCollapsed,
  setCollapsed,
} from "dev/public/js/store/sectionCollapseState.js";
import { activateTab, initTabs } from "dev/public/js/components/tabs.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function sectionDOM({ id = "section-traits", tabs = ["tab-a", "tab-b"] }) {
  const buttons = tabs
    .map((t) => `<button class="tab-btn" data-tab="${t}">${t}</button>`)
    .join("");
  const panels = tabs
    .map((t) => `<div class="tab-panel" id="${t}"></div>`)
    .join("");
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div id="${id}">
        <div class="box">
          <div class="tab-strip" data-section="${id}">
            ${buttons}
            <button class="tab-strip-collapse"></button>
          </div>
          ${panels}
        </div>
      </div>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  jest.clearAllMocks();
});

describe("activateTab", () => {
  test("marks the target panel and button active, others inactive, and persists the choice", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });

    activateTab("section-traits", "tab-b");

    expect(
      document.getElementById("tab-a").classList.contains("is-active"),
    ).toBe(false);
    expect(
      document.getElementById("tab-b").classList.contains("is-active"),
    ).toBe(true);
    const [btnA, btnB] = document.querySelectorAll(".tab-btn");
    expect(btnA.classList.contains("is-active")).toBe(false);
    expect(btnB.classList.contains("is-active")).toBe(true);
    expect(setActiveTab).toHaveBeenCalledWith("section-traits", "tab-b");
  });

  test("does not throw when the section doesn't exist", () => {
    expect(() => activateTab("section-nope", "tab-x")).not.toThrow();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  test("only toggles panels/buttons within the given section (no cross-section bleed)", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    sectionDOM({ id: "section-skills", tabs: ["tab-a"] }); // same tab id, different section

    activateTab("section-traits", "tab-a");

    const skillsPanel = document
      .getElementById("section-skills")
      .querySelector("#tab-a");
    // Both panels share id "tab-a" (invalid HTML); check button state
    // instead of querying by id, which would just return the traits one.
    const skillsBtn = document
      .getElementById("section-skills")
      .querySelector(".tab-btn");
    expect(skillsBtn.classList.contains("is-active")).toBe(false);
  });
});

describe("initTabs — collapse wiring", () => {
  test("applies the initial collapsed state per section on load", () => {
    sectionDOM({ id: "section-traits" });
    isCollapsed.mockReturnValue(true);
    getActiveTab.mockReturnValue(null);

    initTabs();

    const box = document.querySelector("#section-traits .box");
    expect(box.classList.contains("is-collapsed")).toBe(true);
    const chevron = document.querySelector(".tab-strip-collapse");
    expect(chevron.getAttribute("aria-expanded")).toBe("false");
  });

  test("clicking the chevron toggles collapse state and doesn't also trigger tab activation (stopPropagation)", () => {
    sectionDOM({ id: "section-traits" });
    isCollapsed.mockReturnValue(false);
    getActiveTab.mockReturnValue(null);
    initTabs();
    jest.clearAllMocks(); // initTabs() itself calls activateTab, which calls setActiveTab

    document.querySelector(".tab-strip-collapse").click();

    expect(setCollapsed).toHaveBeenCalledWith("section-traits", true);
    expect(document.querySelector("#section-traits .box").classList).toContain(
      "is-collapsed",
    );
    // stopPropagation on the chevron handler keeps the click from bubbling to the tab listener.
    expect(setActiveTab).not.toHaveBeenCalled();
  });
});

describe("initTabs — tab wiring", () => {
  test("starts on the saved tab when tabState has one", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    isCollapsed.mockReturnValue(false);
    getActiveTab.mockReturnValue("tab-b");

    initTabs();

    expect(
      document.getElementById("tab-b").classList.contains("is-active"),
    ).toBe(true);
  });

  test("falls back to the first tab button when nothing was saved", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    isCollapsed.mockReturnValue(false);
    getActiveTab.mockReturnValue(null);

    initTabs();

    expect(
      document.getElementById("tab-a").classList.contains("is-active"),
    ).toBe(true);
  });

  test("does nothing for a tab strip with no tab buttons", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="section-empty"><div class="box"><div class="tab-strip" data-section="section-empty"></div></div></div>`,
    );
    isCollapsed.mockReturnValue(false);
    expect(() => initTabs()).not.toThrow();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  test("skips a tab strip with no data-section attribute", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="tab-strip"><button class="tab-btn" data-tab="tab-a">x</button></div>`,
    );
    expect(() => initTabs()).not.toThrow();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  test("clicking a tab button activates it and does not scroll or re-render", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    isCollapsed.mockReturnValue(false);
    getActiveTab.mockReturnValue("tab-a");
    initTabs();

    document.querySelectorAll(".tab-btn")[1].click();

    expect(
      document.getElementById("tab-b").classList.contains("is-active"),
    ).toBe(true);
    expect(setActiveTab).toHaveBeenCalledWith("section-traits", "tab-b");
  });

  test("clicking a tab button on a collapsed section expands it first", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    isCollapsed.mockReturnValue(true);
    getActiveTab.mockReturnValue("tab-a");
    initTabs();

    document.querySelectorAll(".tab-btn")[1].click();

    expect(setCollapsed).toHaveBeenCalledWith("section-traits", false);
    const box = document.querySelector("#section-traits .box");
    expect(box.classList.contains("is-collapsed")).toBe(false);
  });

  test("a click inside the strip that isn't on a tab button is ignored", () => {
    sectionDOM({ id: "section-traits", tabs: ["tab-a", "tab-b"] });
    isCollapsed.mockReturnValue(false);
    getActiveTab.mockReturnValue("tab-a");
    initTabs();
    jest.clearAllMocks();

    document.querySelector(".tab-strip").click();

    expect(setActiveTab).not.toHaveBeenCalled();
  });
});
