// tabState.js and sectionCollapseState.js are module-level, not persisted.
import { getActiveTab, setActiveTab } from "dev/public/js/store/tabState.js";
import {
  isCollapsed,
  setCollapsed,
} from "dev/public/js/store/sectionCollapseState.js";

// viewModeState.js and themeState.js: persisted to localStorage.
import { isViewMode, setViewMode } from "dev/public/js/store/viewModeState.js";
import {
  getTheme,
  setTheme,
  clearTheme,
} from "dev/public/js/store/themeState.js";

beforeEach(() => localStorage.clear());

describe("tabState", () => {
  test("returns null for a section that has never had a tab set", () => {
    expect(getActiveTab("section-never-touched")).toBeNull();
  });

  test("records and returns the active tab per section", () => {
    setActiveTab("section-traits", "tab-advantages");
    expect(getActiveTab("section-traits")).toBe("tab-advantages");
  });

  test("sections are tracked independently", () => {
    setActiveTab("section-traits", "tab-disadvantages");
    setActiveTab("section-inventory", "tab-armor");
    expect(getActiveTab("section-traits")).toBe("tab-disadvantages");
    expect(getActiveTab("section-inventory")).toBe("tab-armor");
  });
});

describe("sectionCollapseState", () => {
  test("a section that has never been toggled defaults to collapsed (true)", () => {
    expect(isCollapsed("section-never-touched")).toBe(true);
  });

  test("records and returns the collapsed state per section", () => {
    setCollapsed("section-traits", false);
    expect(isCollapsed("section-traits")).toBe(false);
  });

  test("sections are tracked independently", () => {
    setCollapsed("section-traits", false);
    expect(isCollapsed("section-inventory")).toBe(true);
  });
});

describe("viewModeState", () => {
  test("defaults to edit mode (false) when nothing has been persisted", () => {
    expect(isViewMode()).toBe(false);
  });

  test("persists true across reads", () => {
    setViewMode(true);
    expect(isViewMode()).toBe(true);
    expect(localStorage.getItem("archivum:viewMode")).toBe("true");
  });

  test("persists false across reads", () => {
    setViewMode(true);
    setViewMode(false);
    expect(isViewMode()).toBe(false);
  });
});

describe("themeState", () => {
  test("returns null when the user has never chosen a theme", () => {
    expect(getTheme()).toBeNull();
  });

  test("persists a chosen theme", () => {
    setTheme("dark");
    expect(getTheme()).toBe("dark");
  });

  test("ignores a corrupted/unexpected stored value, falling back to null", () => {
    localStorage.setItem("archivum:theme", "not-a-real-theme");
    expect(getTheme()).toBeNull();
  });

  test("clearTheme reverts to null (system preference)", () => {
    setTheme("light");
    clearTheme();
    expect(getTheme()).toBeNull();
  });
});
