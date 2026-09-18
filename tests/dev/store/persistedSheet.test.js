// R11: the persisted shape had two hand-written producers (autosave and export). The assertion
// that matters is that they now agree, because the failure mode was silent — a field that saves
// but never leaves the device, discovered only on another machine.
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import {
  capturePersistedSheet,
  SCHEMA_VERSION,
} from "dev/public/js/store/persistedSheet.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

beforeEach(() => {
  resetDOM();
  resetState();
});

describe("capturePersistedSheet", () => {
  test("produces the four sections plus a version", () => {
    const payload = capturePersistedSheet();

    expect(Object.keys(payload).sort()).toEqual([
      "character",
      "inventory",
      "pc",
      "race",
      "version",
    ]);
    expect(payload.version).toBe(SCHEMA_VERSION);
  });

  test("reads primary attributes from the edit-view inputs, not from state", () => {
    document.getElementById("ST_base").value = "13";
    document.getElementById("ST_mod").value = "2";

    const payload = capturePersistedSheet();

    expect(payload.character.primary.ST).toEqual({
      base_value: 13,
      modifier: 2,
    });
  });

  test("reads carried weight from the #weight input, defaulting to 0", () => {
    expect(capturePersistedSheet().inventory.weight).toBe(0);

    document.getElementById("weight").value = "7.5";
    expect(capturePersistedSheet().inventory.weight).toBe(7.5);
  });

  test("falls back to selected.character when no sheet has been built yet", () => {
    state.sheet = null;
    state.selected.character.character_name = "Sem Build";

    const payload = capturePersistedSheet();

    expect(payload.pc.character_name).toBe("Sem Build");
    expect(payload.race).toEqual({});
  });

  test("prefers the built sheet's pc and race once one exists", () => {
    state.sheet = {
      pc: { character_name: "Construído" },
      race: { race_id: "RACE-023" },
    };

    const payload = capturePersistedSheet();

    expect(payload.pc.character_name).toBe("Construído");
    expect(payload.race.race_id).toBe("RACE-023");
  });

  // The portrait is edited live, so the last build can predate the current crop/scale.
  test("takes the portrait from live state even when the sheet has a stale one", () => {
    state.selected.character.image = { uploaded: true, data: "novo" };
    state.sheet = {
      pc: { character_name: "X", image: { uploaded: true, data: "antigo" } },
      race: {},
    };

    expect(capturePersistedSheet().pc.image.data).toBe("novo");
  });

  test("carries every inventory bucket", () => {
    expect(Object.keys(capturePersistedSheet().inventory).sort()).toEqual([
      "accessories",
      "alchemy",
      "ammo_containers",
      "armors",
      "coins",
      "customInventory",
      "firearms",
      "loose_ammo",
      "magicGear",
      "melee_weapons",
      "ranged_weapons",
      "shields",
      "survivalGear",
      "weight",
    ]);
  });

  test("carries every character section", () => {
    expect(Object.keys(capturePersistedSheet().character).sort()).toEqual([
      "advantages",
      "damage",
      "disadvantages",
      "primary",
      "resistances",
      "secondary",
      "skills",
      "spells",
    ]);
  });
});

// Guard against the two producers drifting apart again.
describe("autosave and export agree on the shape", () => {
  test("exportSheet's payload is capturePersistedSheet plus exportedAt", async () => {
    global.URL.createObjectURL = jest.fn(() => "blob:x");
    global.URL.revokeObjectURL = jest.fn();

    state.selected.character.character_name = "Bran";
    const captured = capturePersistedSheet();

    const { exportSheet } = await import("dev/public/js/store/persistence.js");
    let written = null;
    const OriginalBlob = global.Blob;
    global.Blob = class {
      constructor(parts) {
        written = JSON.parse(parts[0]);
      }
    };

    exportSheet();
    global.Blob = OriginalBlob;

    expect(written).not.toBeNull();
    const { exportedAt, ...rest } = written;
    expect(exportedAt).toEqual(expect.any(String));
    expect(rest).toEqual(captured);
  });
});
