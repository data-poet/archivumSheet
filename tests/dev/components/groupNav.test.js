import {
  initGroupNav,
  activateGroup,
} from "dev/public/js/components/groupNav.js";
import { initNav } from "dev/public/js/components/nav.js";
import { getActiveGroup } from "dev/public/js/store/groupState.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { SHEET_LAYOUT } from "dev/public/js/layout/sheetLayout.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const GROUPS = SHEET_LAYOUT.map(({ group, sections }) => ({
  key: group,
  sections: sections.map(({ id }) => id),
  ...LABELS.nav.groups[group],
}));
const ALL_SECTIONS = GROUPS.flatMap((group) => group.sections);

function groupNavDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="sidebar"></nav><nav id="groupnav"></nav>` +
      ALL_SECTIONS.map(
        (id) => `<section id="${id}" class="l-section"></section>`,
      ).join(""),
  );
}

function visibleSections() {
  return Array.from(
    document.querySelectorAll(".l-section:not([hidden])"),
    (s) => s.id,
  );
}

function groupButton(key) {
  return document.querySelector(`.groupnav-btn[data-group="${key}"]`);
}

beforeEach(() => {
  resetDOM();
  localStorage.clear();
  groupNavDOM();
  global.IntersectionObserver = class {
    observe() {}
  };
  window.scrollTo = jest.fn();
  initNav();
});

describe("initGroupNav — rendering", () => {
  test("renders one tab per group with its icon and label", () => {
    initGroupNav();

    const buttons = document.querySelectorAll("#groupnav .groupnav-btn");
    expect(buttons).toHaveLength(GROUPS.length);
    expect(buttons[0].getAttribute("role")).toBe("tab");
    expect(buttons[0].querySelector(".groupnav-icon").textContent).toBe(
      GROUPS[0].icon,
    );
    expect(buttons[0].querySelector(".groupnav-label").textContent).toBe(
      GROUPS[0].label,
    );
  });

  test("renders the short label for mobile and keeps the full name as the accessible name", () => {
    initGroupNav();

    const button = document.querySelector("#groupnav .groupnav-btn");
    expect(button.querySelector(".groupnav-label-short").textContent).toBe(
      GROUPS[0].short,
    );
    expect(button.getAttribute("aria-label")).toBe(GROUPS[0].label);
  });

  test("starts on the first group when nothing is stored", () => {
    initGroupNav();

    expect(visibleSections()).toEqual(GROUPS[0].sections);
    expect(groupButton(GROUPS[0].key).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  test("restores the stored group", () => {
    localStorage.setItem("archivum:activeGroup", GROUPS[2].key);
    initGroupNav();

    expect(visibleSections()).toEqual(GROUPS[2].sections);
  });

  test("falls back to the first group when the stored key is unknown", () => {
    localStorage.setItem("archivum:activeGroup", "removed-group");
    initGroupNav();

    expect(visibleSections()).toEqual(GROUPS[0].sections);
    expect(getActiveGroup()).toBe(GROUPS[0].key);
  });

  test("does not throw when #groupnav is missing", () => {
    resetDOM();
    expect(() => initGroupNav()).not.toThrow();
  });
});

describe("activateGroup", () => {
  test("shows only the group's sections, persists it, and scopes the sidebar", () => {
    initGroupNav();
    activateGroup(GROUPS[1].key);

    expect(visibleSections()).toEqual(GROUPS[1].sections);
    expect(getActiveGroup()).toBe(GROUPS[1].key);
    expect(
      Array.from(
        document.querySelectorAll("#sidebar .sidebar-link"),
        (l) => l.dataset.section,
      ),
    ).toEqual(GROUPS[1].sections);
  });

  test("moves the selected state and roving tabindex to the new group", () => {
    initGroupNav();
    activateGroup(GROUPS[3].key);

    const active = groupButton(GROUPS[3].key);
    const previous = groupButton(GROUPS[0].key);
    expect(active.classList.contains("is-active")).toBe(true);
    expect(active.tabIndex).toBe(0);
    expect(previous.getAttribute("aria-selected")).toBe("false");
    expect(previous.tabIndex).toBe(-1);
  });
});

describe("initGroupNav — interaction", () => {
  test("clicking a group switches to it and scrolls to the top", () => {
    initGroupNav();
    groupButton(GROUPS[4].key).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(visibleSections()).toEqual(GROUPS[4].sections);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  test("clicking the active group does not scroll", () => {
    initGroupNav();
    groupButton(GROUPS[0].key).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test("arrow keys move to the adjacent group and wrap around", () => {
    initGroupNav();
    const list = document.querySelector(".groupnav-list");

    list.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(getActiveGroup()).toBe(GROUPS.at(-1).key);
    expect(document.activeElement).toBe(groupButton(GROUPS.at(-1).key));

    list.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(getActiveGroup()).toBe(GROUPS[0].key);
  });
});
