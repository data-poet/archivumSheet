jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);
jest.mock("dev/public/js/engine/character/races/model.js", () =>
  require("tests/dev/helpers/mocks/racesModelMock.js"),
);
jest.mock("dev/public/js/engine/character/portrait/portrait.js", () =>
  require("tests/dev/helpers/mocks/portraitMock.js"),
);

import { state } from "dev/public/js/state.js";
import { exportSheet } from "dev/public/js/store/persistence.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

// jsdom doesn't implement the Blob object-URL APIs; without this, exportSheet's
// try/catch would route every export test into its error branch.
beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:mock-url");
  URL.revokeObjectURL = jest.fn();
  // jsdom noisily fails ("Not implemented: navigation") on a real <a> click.
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// jsdom's Blob polyfill lacks .text()/.arrayBuffer(); FileReader still works.
function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

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

  test("includes the active conditions", async () => {
    state.selected.conditions = { "atordoamento-mental": true };

    exportSheet();

    const text = await readBlobText(URL.createObjectURL.mock.calls[0][0]);
    expect(JSON.parse(text).character.conditions).toEqual({
      "atordoamento-mental": true,
    });
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

  test("bundles linked_allies when the active character has linked allies", async () => {
    localStorage.setItem(
      "archivum_characters",
      JSON.stringify({
        activeId: "pc-1",
        list: [
          {
            id: "pc-1",
            name: "Aria",
            race: "",
            kind: "character",
            data: {
              character: {
                allies: [{ id: "ai-1", ally_id: "c-ally-1", overrides: {} }],
              },
            },
          },
          {
            id: "c-ally-1",
            name: "Fido",
            race: "",
            kind: "ally",
            data: {
              pc: { character_name: "Fido" },
              race: {},
              character: {},
              inventory: {},
            },
          },
        ],
      }),
    );

    exportSheet();

    const blob = URL.createObjectURL.mock.calls[0][0];
    const text = await readBlobText(blob);
    const parsed = JSON.parse(text);

    expect(parsed.linked_allies).toEqual({
      "c-ally-1": {
        pc: { character_name: "Fido" },
        race: {},
        character: {},
        inventory: {},
      },
    });
  });

  test("omits linked_allies entirely when the active character has none", async () => {
    localStorage.clear();
    exportSheet();

    const blob = URL.createObjectURL.mock.calls[0][0];
    const text = await readBlobText(blob);
    const parsed = JSON.parse(text);

    expect(parsed.linked_allies).toBeUndefined();
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
