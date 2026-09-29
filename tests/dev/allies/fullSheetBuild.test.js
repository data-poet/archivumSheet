// catalogBuild.test.js round-trips the shipped ally catalog, but every shipped ally has
// every bucket empty. This fixture is a real exported player sheet with a dual-use weapon
// pair, an ammo container with contents, and enchanted accessories/magic gear all present at
// once — combinations nothing else in the suite exercises together through the real engine.
import { toEnginePayload } from "dev/public/js/shared/enginePayload.js";

const fixture = require("tests/dev/helpers/fixtures/sheet.full.json");
const { buildSheet } = require("engine/buildSheet.js");

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
    (w) => w._instanceId === "melee-inst-2",
  );
  const ranged = sheet.inventory.ranged.equipped.find(
    (w) => w._instanceId === "ranged-inst-1",
  );

  expect(melee).toBeDefined();
  expect(ranged).toBeDefined();
  expect(melee.weapon_id).toBe("MELEE-280");
  expect(ranged.weapon_id).toBe("RANGED-005");
});

test("resolves the ammo container's contents and remaining capacity", () => {
  const container = sheet.inventory.ammo.containers.equipped[0];

  expect(container.contents).toEqual([
    { ammo_id: "AMMO-022", quantity: 16, weight: expect.any(Number) },
  ]);
  expect(container.used_capacity).toBe(16);
  expect(container.remaining_capacity).toBe(container.container_capacity - 16);
});

test("applies the accessory's and magic gear's enchantments", () => {
  const accessory = sheet.inventory.accessories.equipped[0];
  const magicGear = sheet.inventory.magicGear.equipped[0];

  expect(accessory.enchantments).toHaveLength(1);
  expect(accessory.enchantments[0].enchantment_id).toBe("ENCHANTMENT-006");
  expect(magicGear.enchantments).toHaveLength(1);
  expect(magicGear.enchantments[0].enchantment_id).toBe("ENCHANTMENT-010");
});

test("resolves every elemental resistance", () => {
  const resistances = sheet.character.elemental_resistances;

  expect(Object.keys(resistances)).toHaveLength(10);
  Object.values(resistances).forEach((r) => expect(r.final).toBeDefined());
});

test("computes carry weight limits", () => {
  expect(sheet.inventory.carry_weight.limits.none).toBeGreaterThan(0);
});
