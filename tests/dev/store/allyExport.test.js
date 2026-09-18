jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import {
  slugify,
  allyIdFor,
  buildAllyFile,
} from "dev/public/js/store/allyExport.js";
import { capturePersistedSheet } from "dev/public/js/store/persistedSheet.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const DATE = new Date("2026-09-18T15:04:05.000Z");

beforeEach(() => {
  resetDOM();
  resetState();
});

describe("slugify", () => {
  // The slug is both a filename and an id, so accents have to go rather than be escaped.
  test.each([
    ["Elemental de Água", "elemental-de-agua"],
    ["Bran, o Batedor", "bran-o-batedor"],
    ["Autômato Nº 7", "automato-n-7"],
    ["  espaços   demais  ", "espacos-demais"],
    ["Ç/Ã\\Ê", "c-a-e"],
  ])("%p becomes %p", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  test("never leaves a leading or trailing separator", () => {
    expect(slugify("--- olá ---")).toBe("ola");
  });

  test("survives an empty or missing name", () => {
    expect(slugify("")).toBe("");
    expect(slugify(undefined)).toBe("");
  });
});

describe("allyIdFor", () => {
  test("is ally-<date>-<slug>", () => {
    expect(allyIdFor("Elemental de Água", DATE)).toBe(
      "ally-2026-09-18-elemental-de-agua",
    );
  });

  test("falls back to a generic slug for an unnamed sheet", () => {
    expect(allyIdFor("", DATE)).toBe("ally-2026-09-18-aliado");
  });

  // Catalog files are renamed to ally-0001-<slug> by hand; the date form marks a user export.
  test("uses a date, never a counter — that is what tells the two sources apart", () => {
    expect(allyIdFor("Bran", DATE)).toMatch(/^ally-\d{4}-\d{2}-\d{2}-/);
  });
});

describe("buildAllyFile", () => {
  test("names the file after the id", () => {
    const { allyId, filename } = buildAllyFile("Bran", DATE);

    expect(allyId).toBe("ally-2026-09-18-bran");
    expect(filename).toBe("ally-2026-09-18-bran.json");
  });

  test("carries the same four sections the engine consumes", () => {
    const { payload } = buildAllyFile("Bran", DATE);

    expect(Object.keys(payload).sort()).toEqual(
      ["character", "inventory", "pc", "portrait", "race", "version"].sort(),
    );
  });

  test("is byte-identical to the persisted sheet apart from pc and the added portrait", () => {
    const sheet = capturePersistedSheet();
    const { payload } = buildAllyFile("Bran", DATE);

    expect(payload.character).toEqual(sheet.character);
    expect(payload.inventory).toEqual(sheet.inventory);
    expect(payload.race).toEqual(sheet.race);
    expect(payload.version).toBe(sheet.version);
  });

  // A base64 blob in a committed catalog file would bloat the repo permanently.
  test("drops the base64 portrait but keeps its framing", () => {
    state.selected.character.image = {
      uploaded: true,
      data: "data:image/png;base64,LONGBLOB",
      background: "average",
      color: { r: 10, g: 20, b: 30 },
      position: { x: 42, y: 61 },
      scale: 120,
    };

    const { payload } = buildAllyFile("Bran", DATE);

    expect(payload.pc.image.data).toBe("");
    expect(payload.pc.image.uploaded).toBe(false);
    expect(payload.pc.image.position).toEqual({ x: 42, y: 61 });
    expect(payload.pc.image.scale).toBe(120);
    expect(payload.pc.image.background).toBe("average");
  });

  test("points the portrait at a PNG of the same name", () => {
    const { payload } = buildAllyFile("Elemental de Água", DATE);

    expect(payload.portrait).toBe(
      "/images/allies/ally-2026-09-18-elemental-de-agua.png",
    );
  });

  test("keeps the rest of pc intact", () => {
    state.selected.character.character_name = "Bran";
    state.selected.character.character_age = 34;

    const { payload } = buildAllyFile("Bran", DATE);

    expect(payload.pc.character_name).toBe("Bran");
    expect(payload.pc.character_age).toBe(34);
  });

  // A timestamp that changes on every re-export would be diff noise in a committed file.
  test("carries no exportedAt, unlike the character export", () => {
    expect(buildAllyFile("Bran", DATE).payload.exportedAt).toBeUndefined();
  });

  test("tolerates a sheet with no image block at all", () => {
    delete state.selected.character.image;

    expect(() => buildAllyFile("Bran", DATE)).not.toThrow();
  });
});

// The point of the creator: what it writes must be consumable by the ally pipeline unchanged.
// This runs an exported file through the same mapper and engine the allies page will use.
describe("an exported ally file feeds the ally pipeline", () => {
  const { toEnginePayload } = require("dev/public/js/shared/enginePayload.js");
  const { buildSheet } = require("engine/buildSheet.js");

  function authorAnAlly() {
    document.getElementById("ST_base").value = "11";
    document.getElementById("DX_base").value = "12";
    state.selected.character.character_name = "Elemental de Água";
    state.selected.advantages = { "ADV-031": {}, "ADV-086": {} };
    state.selected.skills = {
      "SKILL-044": { base_value: 12, modifier: 0, isTrainedWithMaster: false },
    };
    state.selected.armors = [
      {
        _instanceId: "armor-1",
        armor_id: "ARMOR-015",
        material_id: "MAT-000",
        hit_points_modifier: 0,
        is_equipped: true,
        storedAt: null,
        enchantments: [],
      },
    ];
    // A custom race needs no CSV row — the resolved block travels inside the file.
    state.sheet = {
      pc: { character_name: "Elemental de Água" },
      race: {
        race_id: "RACE-ELEM-000",
        race_name: "Elemental",
        race_sub_name: "Elemental de Água",
        modifiers: { ST: 2, DX: 0, IQ: -1, HT: 1 },
        elemental_modifiers: { Fire: 0.5, Ice: 0 },
        innate_advantage_ids: ["ADV-086"],
        innate_disadvantage_ids: [],
      },
    };
  }

  test("builds into a full sheet with resolved attributes and equipment", () => {
    authorAnAlly();

    const { payload } = buildAllyFile("Elemental de Água", DATE);
    const sheet = buildSheet(toEnginePayload(payload));

    // 11 base + 2 from the custom race
    expect(sheet.character.primary_attributes.ST.value).toBe(13);
    expect(sheet.character.secondary_attributes.HP.value).toBeGreaterThan(0);
    expect(sheet.character.skills["SKILL-044"]).toBeDefined();
    expect(sheet.inventory.armor.equipped.torso).toBeDefined();
  });

  test("a race that exists in no CSV still applies its modifiers and innate traits", () => {
    authorAnAlly();

    const { payload } = buildAllyFile("Elemental de Água", DATE);
    const sheet = buildSheet(toEnginePayload(payload));

    expect(sheet.character.elemental_resistances.Fire).toBeDefined();
    // ADV-086 is innate here and also purchased; it must resolve either way.
    expect(sheet.character.advantages["ADV-086"]).toBeDefined();
  });

  test("matches the shape the catalog index reads", () => {
    authorAnAlly();

    const { payload } = buildAllyFile("Elemental de Água", DATE);

    expect(payload.pc.character_name).toBe("Elemental de Água");
    expect(payload.race.race_sub_name).toBe("Elemental de Água");
    expect(payload.portrait).toContain("/images/allies/");
  });
});

// Existing characters must never be mistaken for allies. The kind is only a label — no sheet
// data differs either way — but an ally badge on someone's character is still wrong, so the
// detector is a positive test and everything unrecognised falls through to "character".
describe("isAllyFile", () => {
  const { isAllyFile } = require("dev/public/js/store/allyExport.js");

  test("recognises what buildAllyFile writes", () => {
    expect(isAllyFile(buildAllyFile("Bran", DATE).payload)).toBe(true);
  });

  test("rejects what the character export writes", () => {
    const characterExport = {
      ...capturePersistedSheet(),
      exportedAt: new Date().toISOString(),
    };

    expect(isAllyFile(characterExport)).toBe(false);
  });

  test("rejects the bare persisted sheet", () => {
    expect(isAllyFile(capturePersistedSheet())).toBe(false);
  });

  test.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty object", {}],
    ["an empty portrait", { portrait: "" }],
    ["a truthy non-string portrait", { portrait: true }],
    ["a numeric portrait", { portrait: 1 }],
    ["a null portrait", { portrait: null }],
  ])("rejects %s", (_label, payload) => {
    expect(isAllyFile(payload)).toBe(false);
  });
});
