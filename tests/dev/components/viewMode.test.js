jest.mock("dev/public/js/store/viewModeState.js", () => ({
  isViewMode: jest.fn(),
  setViewMode: jest.fn(),
}));

import { isViewMode, setViewMode } from "dev/public/js/store/viewModeState.js";
import {
  initViewMode,
  syncViewMode,
} from "dev/public/js/components/viewMode.js";
import { t } from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function viewModeDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <button id="view-mode-btn"></button>
      <div id="resume-panel-host"><div id="tab-char-resume">resume content</div></div>
      <div id="view-mode-resume"></div>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  viewModeDOM();
  jest.clearAllMocks();
});

describe("initViewMode — initial resolution", () => {
  test("edit mode (default): no body class, edit button label, panel stays in the edit host", () => {
    isViewMode.mockReturnValue(false);

    initViewMode();

    expect(document.body.classList.contains("is-view-mode")).toBe(false);
    const btn = document.getElementById("view-mode-btn");
    expect(btn.textContent).toBe(t("viewMode.btnView"));
    expect(btn.getAttribute("aria-label")).toBe(t("viewMode.ariaView"));
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(
      document
        .getElementById("resume-panel-host")
        .contains(document.getElementById("tab-char-resume")),
    ).toBe(true);
  });

  test("view mode: body class applied, edit-mode button label, panel moved to the view container", () => {
    isViewMode.mockReturnValue(true);

    initViewMode();

    expect(document.body.classList.contains("is-view-mode")).toBe(true);
    const btn = document.getElementById("view-mode-btn");
    expect(btn.textContent).toBe(t("viewMode.btnEdit"));
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(
      document
        .getElementById("view-mode-resume")
        .contains(document.getElementById("tab-char-resume")),
    ).toBe(true);
  });

  test("does not throw when the toggle button is missing", () => {
    document.getElementById("view-mode-btn").remove();
    isViewMode.mockReturnValue(false);
    expect(() => initViewMode()).not.toThrow();
  });

  test("does not throw, and leaves the panel alone, when the panel or its target container is missing", () => {
    document.getElementById("view-mode-resume").remove();
    isViewMode.mockReturnValue(true);
    expect(() => initViewMode()).not.toThrow();
    expect(document.getElementById("tab-char-resume")).not.toBeNull();
  });
});

describe("initViewMode — toggle button", () => {
  test("clicking flips the mode, persists it, and moves the panel", () => {
    isViewMode.mockReturnValue(false);
    initViewMode();

    document.getElementById("view-mode-btn").click();

    expect(setViewMode).toHaveBeenCalledWith(true);
    expect(document.body.classList.contains("is-view-mode")).toBe(true);
    expect(
      document
        .getElementById("view-mode-resume")
        .contains(document.getElementById("tab-char-resume")),
    ).toBe(true);
  });

  test("clicking twice (mock keeps returning the same isViewMode value) still leaves exactly one panel node", () => {
    isViewMode.mockReturnValue(false); // toggle always computes next = true
    initViewMode();

    const btn = document.getElementById("view-mode-btn");
    btn.click();
    btn.click();

    expect(document.querySelectorAll("#tab-char-resume")).toHaveLength(1);
    expect(
      document
        .getElementById("view-mode-resume")
        .contains(document.getElementById("tab-char-resume")),
    ).toBe(true);
  });
});

describe("syncViewMode", () => {
  test("is a no-op kept only for call-site compatibility", () => {
    expect(() => syncViewMode()).not.toThrow();
    expect(syncViewMode()).toBeUndefined();
  });
});
