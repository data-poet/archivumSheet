import {
  installMockFetch,
  mockFetchResponse,
  mockFetchError,
} from "tests/dev/helpers/mockFetch.js";
import {
  fetchAdvantages,
  fetchDisadvantages,
  fetchSkills,
  fetchSpells,
  fetchRaces,
  fetchMaterials,
  fetchArmors,
  fetchShields,
  fetchMeleeWeapons,
  fetchRangedWeapons,
  fetchFirearms,
  fetchAmmo,
  fetchAmmoContainers,
  fetchAlchemy,
  fetchSurvivalGear,
  fetchAccessories,
  fetchMagicGear,
  fetchEnchantments,
  fetchEnchantmentEffectTypes,
  fetchDualUseWeapons,
  fetchMagicGearEquipLimits,
  fetchItemCategories,
  buildSheet,
} from "dev/public/js/api.js";

beforeEach(() => {
  installMockFetch();
});

describe.each([
  ["fetchAdvantages", fetchAdvantages, "/api/advantages"],
  ["fetchDisadvantages", fetchDisadvantages, "/api/disadvantages"],
  ["fetchSkills", fetchSkills, "/api/skills"],
  ["fetchSpells", fetchSpells, "/api/spells"],
  ["fetchRaces", fetchRaces, "/api/races"],
  ["fetchMaterials", fetchMaterials, "/api/materials"],
  ["fetchArmors", fetchArmors, "/api/armors"],
  ["fetchShields", fetchShields, "/api/shields"],
  ["fetchMeleeWeapons", fetchMeleeWeapons, "/api/melee_weapons"],
  ["fetchRangedWeapons", fetchRangedWeapons, "/api/ranged_weapons"],
  ["fetchFirearms", fetchFirearms, "/api/firearms"],
  ["fetchAmmo", fetchAmmo, "/api/ammo"],
  ["fetchAmmoContainers", fetchAmmoContainers, "/api/ammo_containers"],
  ["fetchAlchemy", fetchAlchemy, "/api/alchemy"],
  ["fetchSurvivalGear", fetchSurvivalGear, "/api/survival_gear"],
  ["fetchAccessories", fetchAccessories, "/api/accessories"],
  ["fetchMagicGear", fetchMagicGear, "/api/magic_gear"],
  ["fetchEnchantments", fetchEnchantments, "/api/enchantments"],
  [
    "fetchEnchantmentEffectTypes",
    fetchEnchantmentEffectTypes,
    "/api/enchantments/effect-types",
  ],
  [
    "fetchDualUseWeapons",
    fetchDualUseWeapons,
    "/api/inventory/dual-use-weapons",
  ],
  [
    "fetchMagicGearEquipLimits",
    fetchMagicGearEquipLimits,
    "/api/magic-gear/equip-limits",
  ],
  [
    "fetchItemCategories",
    fetchItemCategories,
    "/api/inventory/item-categories",
  ],
])("%s", (_name, fn, url) => {
  test(`calls fetch(${url}) with no options (a plain GET) and resolves with the parsed body`, async () => {
    const body = { marker: `payload-for-${url}` };
    mockFetchResponse(url, body);

    const result = await fn();

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(result).toEqual(body);
  });

  test(`rejects with a descriptive error when the response is not ok`, async () => {
    mockFetchError(url, 404);

    await expect(fn()).rejects.toThrow(`GET ${url} failed: 404`);
  });
});

describe("buildSheet", () => {
  test("POSTs the payload as JSON with the correct headers and URL", async () => {
    const payload = { character: { character_name: "Fulano" } };
    mockFetchResponse("/api/sheet/build", { sheet: "computed" });

    const result = await buildSheet(payload);

    expect(global.fetch).toHaveBeenCalledWith("/api/sheet/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual({ sheet: "computed" });
  });

  test("rejects with a descriptive error when the response is not ok", async () => {
    mockFetchError("/api/sheet/build", 500);

    await expect(buildSheet({})).rejects.toThrow(
      "POST /api/sheet/build failed: 500",
    );
  });
});
