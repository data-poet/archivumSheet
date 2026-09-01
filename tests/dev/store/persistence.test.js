// Same dependency-mocking approach as characters.test.js: state.js and
// compute/attributes.js (via the DOM fixture) are real, the render/autorun
// side effects are mocked since their job here is just "were you called".
jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/races/model.js", () => ({
  restoreRaceSelection: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/portrait/portrait.js", () => ({
  renderCharacterImage: jest.fn(),
  renderResumeImage: jest.fn(),
}));

import { renderListsPreserving } from "dev/public/js/ui.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { state } from "dev/public/js/state.js";
import {
  showToast,
  exportSheet,
  importSheet,
} from "dev/public/js/store/persistence.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

// jsdom doesn't implement the Blob object-URL APIs at all — exportSheet's
// try/catch would otherwise silently route every export test into its
// error branch. Polyfilling with jest.fn() lets tests assert on what
// exportSheet actually passed in.
beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:mock-url");
  URL.revokeObjectURL = jest.fn();
  // jsdom attempts (and fails, noisily logging "Not implemented: navigation")
  // to actually navigate when an <a> with an href is clicked. exportSheet
  // only cares that .click() was invoked to trigger the download, not that
  // navigation happens, so stub it out.
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function validPayload(overrides = {}) {
  return {
    version: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    pc: { character_name: "Imported Hero" },
    race: { race_id: null },
    character: {
      primary: { ST: { base_value: 12, modifier: 1 } },
      secondary: {},
      damage: {},
      resistances: {},
      advantages: { "ADV-001": { level: 2 } },
      disadvantages: {},
      skills: {},
      spells: {},
    },
    inventory: {
      weight: 8,
      armors: [{ instance_id: "armor-inst-1" }],
      shields: [],
      melee_weapons: [],
      ranged_weapons: [],
      firearms: [],
      ammo_containers: [],
      loose_ammo: [],
      alchemy: [],
      survivalGear: [],
      accessories: [],
      magicGear: [],
      customInventory: [],
      coins: [],
    },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// showToast
// ─────────────────────────────────────────────────────────────────────────
describe("showToast", () => {
  test("renders the message and the matching icon per type", () => {
    showToast("Saved!", "success");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.querySelector(".toast-message").textContent).toBe("Saved!");
    expect(toast.querySelector(".toast-icon").textContent).toBe("✓");
    expect(toast.className).toBe("toast toast--success");
  });

  test("falls back to the info icon for an unrecognized type", () => {
    showToast("Hmm", "not-a-real-type");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.querySelector(".toast-icon").textContent).toBe("ℹ");
  });

  test("replaces any existing toast rather than stacking them", () => {
    showToast("First");
    showToast("Second");
    const toasts = document.querySelectorAll("#_archivum-toast");
    expect(toasts).toHaveLength(1);
    expect(toasts[0].querySelector(".toast-message").textContent).toBe(
      "Second",
    );
  });

  test("renders an action button only when actionLabel + onAction are both given", () => {
    showToast("With action", "info", {
      actionLabel: "Desfazer",
      onAction: () => {},
    });
    expect(document.querySelector(".toast-action").textContent).toBe(
      "Desfazer",
    );
  });

  test("renders the action button even without onAction, but it's inert (no listener)", () => {
    // The button's markup is gated on actionLabel alone; only the click
    // listener is gated on actionLabel && onAction. So the button appears
    // but clicking it does nothing — worth locking in explicitly since
    // it's a real (if minor) asymmetry in the source.
    showToast("No handler", "info", { actionLabel: "Desfazer" });
    const button = document.querySelector(".toast-action");
    expect(button.textContent).toBe("Desfazer");
    expect(() => button.dispatchEvent(new Event("click"))).not.toThrow();
  });

  test("clicking the action button calls onAction and starts the dismiss", () => {
    const onAction = jest.fn();
    showToast("Actionable", "info", { actionLabel: "Desfazer", onAction });

    document.querySelector(".toast-action").dispatchEvent(new Event("click"));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(
      document
        .getElementById("_archivum-toast")
        .classList.contains("is-visible"),
    ).toBe(false);
  });

  test("fades in on the next frame", () => {
    showToast("Fade in");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.classList.contains("is-visible")).toBe(false);

    // advanceTimersToNextFrame() flushes only the rAF-scheduled fade-in,
    // leaving the separately-scheduled 3000ms auto-dismiss timer untouched.
    // runOnlyPendingTimers() would fire BOTH at once here (verified via a
    // scratch probe) and defeat the point of this test.
    jest.advanceTimersToNextFrame();

    expect(toast.classList.contains("is-visible")).toBe(true);
  });

  test("auto-dismisses after the default 3000ms", () => {
    showToast("Auto dismiss");
    jest.advanceTimersToNextFrame(); // flush the fade-in first
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(3000);

    expect(toast.classList.contains("is-visible")).toBe(false);
  });

  test("respects a custom duration", () => {
    showToast("Quick", "info", { duration: 500 });
    jest.advanceTimersToNextFrame(); // consumes ~16ms of virtual time itself
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(400);
    expect(toast.classList.contains("is-visible")).toBe(true);

    jest.advanceTimersByTime(200); // total now well past the 500ms duration
    expect(toast.classList.contains("is-visible")).toBe(false);
  });

  test("fully removes the element once the dismiss transition ends", () => {
    showToast("Removable");
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(3000); // triggers dismiss()
    toast.dispatchEvent(new Event("transitionend"));

    expect(document.getElementById("_archivum-toast")).toBeNull();
  });
});

// jsdom's Blob polyfill doesn't implement .text()/.arrayBuffer() — read
// content back out via FileReader instead, which jsdom does support.
function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// exportSheet
// ─────────────────────────────────────────────────────────────────────────
describe("exportSheet", () => {
  test("builds a JSON blob containing the current sheet state", async () => {
    document.getElementById("ST_base").value = "14";
    state.selected.character.character_name = "Export Test";
    state.selected.armors = [{ instance_id: "armor-inst-1" }];

    exportSheet();

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = URL.createObjectURL.mock.calls[0][0];
    const text = await readBlobText(blob);
    const parsed = JSON.parse(text);

    expect(parsed.character.primary.ST.base_value).toBe(14);
    expect(parsed.inventory.armors).toEqual([{ instance_id: "armor-inst-1" }]);
  });

  test("includes the current elemental resistances", async () => {
    state.selected.resistances = { Fire: { modifier: -0.5 } };

    exportSheet();

    const blob = URL.createObjectURL.mock.calls[0][0];
    const text = await readBlobText(blob);
    const parsed = JSON.parse(text);

    expect(parsed.character.resistances).toEqual({
      Fire: { modifier: -0.5 },
    });
  });

  test("shows a success toast naming the exported file", () => {
    state.selected.character.character_name = "Export Test";
    exportSheet();
    const toast = document.getElementById("_archivum-toast");
    expect(toast.className).toBe("toast toast--success");
    expect(toast.querySelector(".toast-message").textContent).toContain(
      "archivum_Export_Test",
    );
  });

  test("falls back to 'personagem' as the filename when no name is set", () => {
    exportSheet();
    const toast = document.getElementById("_archivum-toast");
    expect(toast.querySelector(".toast-message").textContent).toContain(
      "archivum_personagem",
    );
  });

  test("shows an error toast when building the download fails", () => {
    URL.createObjectURL.mockImplementation(() => {
      throw new Error("boom");
    });

    exportSheet();

    const toast = document.getElementById("_archivum-toast");
    expect(toast.className).toBe("toast toast--error");
    expect(toast.querySelector(".toast-message").textContent).toContain("boom");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// importSheet
// ─────────────────────────────────────────────────────────────────────────
describe("importSheet", () => {
  function jsonFile(payload, name = "character.json") {
    return new File([JSON.stringify(payload)], name, {
      type: "application/json",
    });
  }

  test("rejects when no file is given", async () => {
    await expect(importSheet(null)).rejects.toThrow(
      "Nenhum arquivo selecionado.",
    );
  });

  test("rejects (and toasts) a file that isn't .json", async () => {
    const file = new File(["not json"], "notes.txt", { type: "text/plain" });
    await expect(importSheet(file)).rejects.toThrow(
      "O arquivo deve ser um .json exportado pelo Archivum.",
    );
    expect(document.getElementById("_archivum-toast").className).toBe(
      "toast toast--error",
    );
  });

  test("hydrates state from a valid payload and resolves", async () => {
    await importSheet(jsonFile(validPayload()));

    expect(state.selected.character.character_name).toBe("Imported Hero");
    expect(state.selected.armors).toEqual([{ instance_id: "armor-inst-1" }]);
    expect(state.selected.advantages).toEqual({ "ADV-001": { level: 2 } });
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("hydrates elemental resistances from the payload", async () => {
    await importSheet(
      jsonFile(
        validPayload({
          character: {
            ...validPayload().character,
            resistances: { Fire: { modifier: -0.5 } },
          },
        }),
      ),
    );

    expect(state.selected.resistances).toEqual({
      Fire: { modifier: -0.5 },
    });
  });

  test("writes primary attributes and weight into their DOM inputs", async () => {
    await importSheet(jsonFile(validPayload()));

    expect(document.getElementById("ST_base").value).toBe("12");
    expect(document.getElementById("ST_mod").value).toBe("1");
    expect(document.getElementById("weight").value).toBe("8");
  });

  test("shows a success toast naming the imported character", async () => {
    await importSheet(jsonFile(validPayload()));
    const toast = document.getElementById("_archivum-toast");
    expect(toast.className).toBe("toast toast--success");
    expect(toast.querySelector(".toast-message").textContent).toContain(
      "Imported Hero",
    );
  });

  test("rejects and toasts when required fields are missing (invalid schema)", async () => {
    const incomplete = validPayload();
    delete incomplete.inventory;

    await expect(importSheet(jsonFile(incomplete))).rejects.toThrow(
      "Arquivo inválido",
    );
    expect(document.getElementById("_archivum-toast").className).toBe(
      "toast toast--error",
    );
    // Nothing should have been applied to state on a rejected import.
    expect(renderListsPreserving).not.toHaveBeenCalled();
  });

  test("rejects and toasts on malformed JSON content", async () => {
    const badFile = new File(["{not valid json"], "character.json", {
      type: "application/json",
    });

    await expect(importSheet(badFile)).rejects.toThrow();
    expect(document.getElementById("_archivum-toast").className).toBe(
      "toast toast--error",
    );
  });
});
