import {
  nextArmorInstanceId,
  nextShieldInstanceId,
  nextMeleeInstanceId,
  nextRangedInstanceId,
  nextFirearmInstanceId,
  nextAmmoContainerInstanceId,
  nextLooseAmmoInstanceId,
  nextAlchemyInstanceId,
  nextAccessoryInstanceId,
  nextMagicGearInstanceId,
  nextEnchantmentInstanceId,
  resetInstanceCounters,
} from "dev/public/js/store/instanceId.js";

// Counters are module-level singletons — reset before every test so none of
// them leak state between tests.
beforeEach(() => resetInstanceCounters());

describe("per-type instance id generators", () => {
  test.each([
    ["armor", nextArmorInstanceId, "armor-inst-"],
    ["shield", nextShieldInstanceId, "shield-inst-"],
    ["melee", nextMeleeInstanceId, "melee-inst-"],
    ["ranged", nextRangedInstanceId, "ranged-inst-"],
    ["firearm", nextFirearmInstanceId, "firearm-inst-"],
    ["ammo container", nextAmmoContainerInstanceId, "ammo-cont-inst-"],
    ["loose ammo", nextLooseAmmoInstanceId, "loose-ammo-inst-"],
    ["alchemy", nextAlchemyInstanceId, "alchemy-inst-"],
    ["accessory", nextAccessoryInstanceId, "accessory-inst-"],
    ["magic gear", nextMagicGearInstanceId, "magic-gear-inst-"],
    ["enchantment", nextEnchantmentInstanceId, "enchantment-inst-"],
  ])("%s ids start at 1 and increment on each call", (_label, fn, prefix) => {
    expect(fn()).toBe(`${prefix}1`);
    expect(fn()).toBe(`${prefix}2`);
    expect(fn()).toBe(`${prefix}3`);
  });

  test("counters for different types are independent of one another", () => {
    nextArmorInstanceId();
    nextArmorInstanceId();
    expect(nextShieldInstanceId()).toBe("shield-inst-1");
    expect(nextArmorInstanceId()).toBe("armor-inst-3");
  });
});

describe("resetInstanceCounters", () => {
  test("resets every counter back to 1, independently", () => {
    nextArmorInstanceId();
    nextArmorInstanceId();
    nextShieldInstanceId();
    nextEnchantmentInstanceId();
    nextEnchantmentInstanceId();
    nextEnchantmentInstanceId();

    resetInstanceCounters();

    expect(nextArmorInstanceId()).toBe("armor-inst-1");
    expect(nextShieldInstanceId()).toBe("shield-inst-1");
    expect(nextEnchantmentInstanceId()).toBe("enchantment-inst-1");
  });
});
