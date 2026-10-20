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

import { renderListsPreserving } from "dev/public/js/ui.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { state } from "dev/public/js/state.js";
import { exportSheet, importSheet } from "dev/public/js/store/persistence.js";
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
    expect(state.selected.armors).toEqual([
      { instance_id: "armor-inst-1", id: expect.any(String) },
    ]);
    expect(state.selected.advantages).toEqual({ "ADV-001": { level: 2 } });
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  // validPayload() above is a minimal, hand-built shape. This is a real exported file with
  // every inventory bucket populated and a linked dual-use weapon pair, guarding against
  // _applyImport dropping or mis-mapping a bucket that a minimal payload can't exercise.
  test("hydrates every inventory bucket from a real exported sheet", async () => {
    const fixture = require("tests/dev/helpers/fixtures/sheet.full.json");

    await importSheet(jsonFile(fixture));

    expect(state.selected.character.character_name).toBe(
      fixture.pc.character_name,
    );
    expect(state.selected.armors).toEqual(fixture.inventory.armors);
    expect(state.selected.melee_weapons).toEqual(
      fixture.inventory.melee_weapons,
    );
    expect(state.selected.ranged_weapons).toEqual(
      fixture.inventory.ranged_weapons,
    );
    expect(state.selected.ammo_containers).toEqual(
      fixture.inventory.ammo_containers,
    );
    expect(state.selected.accessories).toEqual(fixture.inventory.accessories);
    expect(state.selected.magicGear).toEqual(fixture.inventory.magicGear);
    expect(state.selected.coins).toEqual(fixture.inventory.coins);

    const melee = state.selected.melee_weapons.find(
      (w) => w.id === "melee-inst-2",
    );
    expect(melee._linkedInstanceId).toBe("ranged-inst-1");
  });

  test("hydrates the active conditions, and none for a file saved before they existed", async () => {
    await importSheet(
      jsonFile(
        validPayload({
          character: {
            ...validPayload().character,
            conditions: { "dor-grave": true },
          },
        }),
      ),
    );
    expect(state.selected.conditions).toEqual({ "dor-grave": true });

    await importSheet(jsonFile(validPayload()));
    expect(state.selected.conditions).toEqual({});
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
