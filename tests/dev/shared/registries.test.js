import fs from "fs";
import path from "path";
import {
  PRIMARY_ATTRIBUTES,
  DEFAULT_PRIMARY_VALUE,
  ARMOR_SLOTS,
  ARMOR_SLOT_KEYS,
} from "dev/public/js/shared/constants.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resolveRace } from "engine/character/js/traits/races.js";
import { PRIMARY_KEYS, PRIMARY_DEFAULT_VALUE } from "helpers/rules.js";
import { loadDataset } from "helpers/datasets.js";
import { SLOT_MAP } from "engine/inventory/js/armor/armorConstants.js";
import { ELEMENTAL_TYPES } from "engine/character/js/attributes/elementalResistances.js";

const PUBLIC = path.join(__dirname, "../../../dev/public");

describe("primary attributes mirror the engine rules", () => {
  test("same keys and default value", () => {
    expect(PRIMARY_ATTRIBUTES).toEqual(PRIMARY_KEYS);
    expect(DEFAULT_PRIMARY_VALUE).toBe(PRIMARY_DEFAULT_VALUE);
  });

  test("index.html starts every base input at the default and every modifier at 0", () => {
    const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
    PRIMARY_ATTRIBUTES.forEach((attr) => {
      const input = (suffix) =>
        new RegExp(`id="${attr}_${suffix}"[^>]*value="(-?\\d+)"`).exec(html);
      expect(Number(input("base")[1])).toBe(DEFAULT_PRIMARY_VALUE);
      expect(Number(input("mod")[1])).toBe(0);
    });
  });
});

describe("armor slots mirror the engine", () => {
  test("ARMOR_SLOT_KEYS equals the engine's SLOT_MAP", () => {
    expect(ARMOR_SLOT_KEYS).toEqual(SLOT_MAP);
  });

  test("every slot the armor CSV uses is a known slot", () => {
    const used = new Set(
      loadDataset("ARMORS").map((row) => row.armor_piece_location),
    );
    expect([...used].sort()).toEqual([...ARMOR_SLOTS].sort());
  });
});

describe("elemental types line up across engine, labels and payload", () => {
  test("every engine element has a label, and no label is orphaned", () => {
    expect(Object.keys(LABELS.elementalResistances).sort()).toEqual(
      [...ELEMENTAL_TYPES].sort(),
    );
  });

  test("resolveRace emits a multiplier for every engine element", () => {
    const [{ race_id }] = loadDataset("RACES");
    const { elemental_modifiers } = resolveRace(race_id);
    expect(Object.keys(elemental_modifiers).sort()).toEqual(
      [...ELEMENTAL_TYPES].sort(),
    );
  });
});

// A list respelled outside the registry is where drift starts, so the sources must import it.
describe("no registry literal outside the registries", () => {
  const sources = fs
    .readdirSync(path.join(PUBLIC, "js"), { recursive: true })
    .filter((f) => f.endsWith(".js"))
    .filter((f) => f !== path.join("shared", "constants.js"))
    .filter((f) => !f.includes(`${path.sep}localization${path.sep}`));

  test.each(sources.map((f) => [f]))("%s", (file) => {
    const source = fs.readFileSync(path.join(PUBLIC, "js", file), "utf8");
    expect(source).not.toMatch(/\[\s*"ST",\s*"DX",\s*"IQ",\s*"HT"\s*\]/);
    expect(source).not.toMatch(
      /["'](Cabeça|Tronco|Braços|Mãos|Pernas|Pés)["']/,
    );
  });
});
