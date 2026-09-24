jest.mock("dev/public/js/store/allies.js", () => ({
  getRoster: jest.fn(),
  getActiveAllyInstanceId: jest.fn(),
  setActiveAllyInstanceId: jest.fn(),
  removeRosterEntry: jest.fn(),
}));
jest.mock("dev/public/js/components/dialog.js", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("dev/public/js/shared/toast.js", () => ({
  showToast: jest.fn(),
}));

import {
  getRoster,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  removeRosterEntry,
} from "dev/public/js/store/allies.js";
import { showConfirm } from "dev/public/js/components/dialog.js";
import { showToast } from "dev/public/js/shared/toast.js";
import {
  updateRosterButton,
  renderPopover,
  openSelector,
  closeSelector,
  toggleSelector,
  initAllyRosterSelector,
} from "dev/public/js/components/allyRosterSelector.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const flush = () => new Promise((r) => setTimeout(r, 20));

function selectorDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <button id="ally-selector-btn"></button>
      <div id="ally-selector-popover"></div>
    `,
  );
}

const INDEX = [
  { ally_id: "ALLY_HUMANOID_001", name: "Bran" },
  { ally_id: "ALLY_ANIMAL_001", name: "Lobo" },
];

const ROSTER = [
  { _instanceId: "ai-1", ally_id: "ALLY_HUMANOID_001", overrides: {} },
  { _instanceId: "ai-2", ally_id: "ALLY_ANIMAL_001", overrides: {} },
];

beforeEach(() => {
  resetDOM();
  selectorDOM();
  jest.clearAllMocks();
  getRoster.mockReturnValue(ROSTER);
  getActiveAllyInstanceId.mockReturnValue("ai-1");
});

describe("updateRosterButton", () => {
  test("shows the active roster entry's name", () => {
    initAllyRosterSelector({ index: INDEX });
    expect(
      document
        .getElementById("ally-selector-btn")
        .querySelector(".char-selector-btn-name").textContent,
    ).toBe("Bran");
  });

  test("falls back to the pick prompt when nothing is active", () => {
    getActiveAllyInstanceId.mockReturnValue(null);
    initAllyRosterSelector({ index: INDEX });
    expect(
      document
        .getElementById("ally-selector-btn")
        .querySelector(".char-selector-btn-name").textContent,
    ).toBe(t("allies.pickPrompt"));
  });

  test("does not throw when the button isn't in the DOM", () => {
    document.getElementById("ally-selector-btn").remove();
    expect(() => updateRosterButton()).not.toThrow();
  });
});

describe("renderPopover", () => {
  test("shows the empty message when the roster has no entries", () => {
    getRoster.mockReturnValue([]);
    initAllyRosterSelector({ index: INDEX });
    expect(document.querySelector(".char-selector-empty").textContent).toBe(
      t("allies.rosterEmpty"),
    );
  });

  test("lists every roster entry, marking the active one", () => {
    initAllyRosterSelector({ index: INDEX });
    const items = document.querySelectorAll(".char-selector-item");
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains("is-active")).toBe(true);
    expect(items[1].classList.contains("is-active")).toBe(false);
  });

  test("falls back to the raw id when the entry isn't in the index", () => {
    getRoster.mockReturnValue([
      { _instanceId: "ai-9", ally_id: "ALLY_UNKNOWN", overrides: {} },
    ]);
    initAllyRosterSelector({ index: INDEX });
    expect(
      document.querySelector(".char-selector-item-name").textContent,
    ).toBe("ALLY_UNKNOWN");
  });

  test("does not throw when the popover isn't in the DOM", () => {
    document.getElementById("ally-selector-popover").remove();
    expect(() => renderPopover()).not.toThrow();
  });
});

describe("openSelector / closeSelector / toggleSelector", () => {
  test("openSelector adds is-open and marks the trigger expanded", () => {
    openSelector();
    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
    expect(
      document.getElementById("ally-selector-btn").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  test("closeSelector removes is-open", () => {
    openSelector();
    closeSelector();
    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("toggleSelector flips open/closed", () => {
    toggleSelector();
    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
    toggleSelector();
    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });
});

describe("initAllyRosterSelector — select-ally", () => {
  test("selecting the already-active entry just closes the popover", () => {
    const onChange = jest.fn();
    initAllyRosterSelector({ index: INDEX, onChange });
    openSelector();

    document
      .querySelector('[data-action="select-ally"][data-id="ai-1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(setActiveAllyInstanceId).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("selecting a different entry sets it active and notifies onChange", () => {
    const onChange = jest.fn();
    initAllyRosterSelector({ index: INDEX, onChange });
    openSelector();

    document
      .querySelector('[data-action="select-ally"][data-id="ai-2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(setActiveAllyInstanceId).toHaveBeenCalledWith("ai-2");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("initAllyRosterSelector — edit-ally (stub)", () => {
  test("shows a not-available toast and does not touch the roster", () => {
    initAllyRosterSelector({ index: INDEX });
    openSelector();

    document
      .querySelector('[data-action="edit-ally"][data-id="ai-1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(showToast).toHaveBeenCalledWith(
      t("allies.editNotAvailable"),
      "info",
    );
    expect(removeRosterEntry).not.toHaveBeenCalled();
  });
});

describe("initAllyRosterSelector — remove-ally", () => {
  test("asks for confirmation, and does nothing when declined", async () => {
    showConfirm.mockResolvedValue(false);
    initAllyRosterSelector({ index: INDEX });
    openSelector();

    document
      .querySelector('[data-action="remove-ally"][data-id="ai-2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(showConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: t("allies.confirmRemoveTitle"),
        danger: true,
      }),
    );
    expect(removeRosterEntry).not.toHaveBeenCalled();
  });

  test("removes the entry once confirmed and notifies onChange", async () => {
    showConfirm.mockResolvedValue(true);
    const onChange = jest.fn();
    initAllyRosterSelector({ index: INDEX, onChange });
    openSelector();

    document
      .querySelector('[data-action="remove-ally"][data-id="ai-2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(removeRosterEntry).toHaveBeenCalledWith("ai-2");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("initAllyRosterSelector — outside click / escape", () => {
  test("Escape closes the popover and hands focus back to the trigger", () => {
    initAllyRosterSelector({ index: INDEX });
    document.getElementById("ally-selector-btn").click();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
    expect(document.activeElement).toBe(
      document.getElementById("ally-selector-btn"),
    );
  });

  test("clicking outside the popover and button closes it", () => {
    initAllyRosterSelector({ index: INDEX });
    document.getElementById("ally-selector-btn").click();

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      document
        .getElementById("ally-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });
});
