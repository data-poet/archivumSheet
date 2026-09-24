jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveKind: jest.fn(() => "character"),
}));
jest.mock("dev/public/js/store/allyOnlyContent.js", () => ({
  findAllyOnlyContent: jest.fn(() => []),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  showToast: jest.fn(),
}));

import { getActiveKind } from "dev/public/js/store/characters.js";
import { findAllyOnlyContent } from "dev/public/js/store/allyOnlyContent.js";
import { showToast } from "dev/public/js/store/persistence.js";
import {
  renderEntryKind,
  warnAllyOnlyContent,
} from "dev/public/js/components/entryKind.js";

beforeEach(() => {
  document.body.classList.remove("is-ally-draft");
  jest.clearAllMocks();
  getActiveKind.mockReturnValue("character");
  findAllyOnlyContent.mockReturnValue([]);
});

describe("renderEntryKind", () => {
  test("marks the body only while the active entry is an ally draft", () => {
    getActiveKind.mockReturnValue("ally");
    renderEntryKind();
    expect(document.body.classList.contains("is-ally-draft")).toBe(true);

    getActiveKind.mockReturnValue("character");
    renderEntryKind();
    expect(document.body.classList.contains("is-ally-draft")).toBe(false);
  });
});

describe("warnAllyOnlyContent", () => {
  test("stays quiet and returns false when nothing is ally-only", () => {
    expect(warnAllyOnlyContent()).toBe(false);
    expect(showToast).not.toHaveBeenCalled();
  });

  test("toasts the offending labels and returns true", () => {
    findAllyOnlyContent.mockReturnValue([
      { id: "ADV-ALLY-1", label: "Corpo Elemental" },
    ]);

    expect(warnAllyOnlyContent()).toBe(true);
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toContain("Corpo Elemental");
    expect(showToast.mock.calls[0][1]).toBe("error");
  });
});
