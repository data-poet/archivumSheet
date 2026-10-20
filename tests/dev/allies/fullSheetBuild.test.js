// catalogBuild.test.js round-trips the shipped ally catalog, but every shipped ally has
// every bucket empty. This fixture is a real exported player sheet with a dual-use weapon
// pair, an ammo container with contents, and enchanted accessories/magic gear all present at
// once — combinations nothing else in the suite exercises together through the real engine.
const {
  AMMO,
  ENCHANTMENT,
  MELEE,
  RANGED,
  remapLegacyIds,
} = require("tests/helpers/dataRefs");
import { toEnginePayload } from "dev/public/js/shared/enginePayload.js";

const rawFixture = require("tests/dev/helpers/fixtures/sheet.full.json");
const { buildSheet } = require("engine/buildSheet.js");

const fixture = remapLegacyIds(rawFixture);

const sheet = buildSheet(toEnginePayload(fixture));

test("resolves primary and secondary attributes", () => {
  expect(sheet.character.primary_attributes.ST.value).toBeGreaterThan(0);
  expect(sheet.character.secondary_attributes.HP.value).toBeGreaterThan(0);
  expect(sheet.character.secondary_attributes.Dodge.value).toBeGreaterThan(0);
});

test("resolves every purchased skill and spell", () => {
  Object.keys(fixture.character.skills).forEach((skillId) => {
    expect(sheet.character.skills[skillId]).toBeDefined();
  });
  const spellValues = Object.values(sheet.grimoire).map((s) => s.value);
  Object.values(fixture.character.spells).forEach(({ base_value }, i) => {
    expect(spellValues[i]).toBeGreaterThanOrEqual(base_value);
  });
});

test("resolves the dual-use melee/ranged pair as two distinct, linked instances", () => {
  const melee = sheet.inventory.melee.equipped.find(
    (w) => w.id === "melee-inst-2",
  );
  const ranged = sheet.inventory.ranged.equipped.find(
    (w) => w.id === "ranged-inst-1",
  );

  expect(melee).toBeDefined();
  expect(ranged).toBeDefined();
  expect(melee.weapon_id).toBe(MELEE.machadinha);
  expect(ranged.weapon_id).toBe(RANGED.machadinha);
});

test("resolves the ammo container's contents and remaining capacity", () => {
  const container = sheet.inventory.ammo.containers.equipped[0];

  expect(container.contents).toEqual([
    { ammo_id: AMMO.bolaDeFerro, quantity: 16, weight: expect.any(Number) },
  ]);
  expect(container.used_capacity).toBe(16);
  expect(container.remaining_capacity).toBe(container.container_capacity - 16);
});

test("applies the accessory's and magic gear's enchantments", () => {
  const accessory = sheet.inventory.accessories.equipped[0];
  const magicGear = sheet.inventory.magicGear.equipped[0];

  expect(accessory.enchantments).toHaveLength(1);
  expect(accessory.enchantments[0].enchantment_id).toBe(ENCHANTMENT.fortifyHT);
  expect(magicGear.enchantments).toHaveLength(1);
  expect(magicGear.enchantments[0].enchantment_id).toBe(
    ENCHANTMENT.fortifyMana,
  );
});

test("resolves every elemental resistance", () => {
  const resistances = sheet.character.elemental_resistances;

  expect(Object.keys(resistances)).toHaveLength(10);
  Object.values(resistances).forEach((r) => expect(r.final).toBeDefined());
});

test("computes carry weight limits", () => {
  expect(sheet.inventory.carry_weight.limits.none).toBeGreaterThan(0);
});

describe("active conditions through the real payload and engine", () => {
  const withConditions = (conditions) =>
    buildSheet(
      toEnginePayload({
        ...fixture,
        character: { ...fixture.character, conditions },
      }),
    );

  test("a sheet with no conditions switched on carries no condition fields", () => {
    expect(JSON.stringify(sheet)).not.toMatch(
      /condition_modifier|effective_|"conditions"/,
    );
    expect(JSON.stringify(withConditions({ "dor-grave": false }))).toBe(
      JSON.stringify(sheet),
    );
  });

  test("pain and stun reach skills, spells and defenses of a full sheet", () => {
    const hit = withConditions({
      "dor-grave": true,
      "atordoamento-fisico": true,
    });

    expect(hit.character.conditions.active.map((c) => c.key)).toEqual([
      "atordoamento-fisico",
      "dor-grave",
    ]);
    Object.values(hit.character.skills).forEach((skill) => {
      expect(skill.effective_value).toBe(skill.value - 4);
    });
    Object.values(hit.grimoire).forEach((spell) => {
      expect(spell.effective_value).toBe(spell.value - 4);
    });
    const { Dodge } = hit.character.secondary_attributes;
    expect(Dodge.effective_value).toBe(Dodge.value - 4);
  });
});
