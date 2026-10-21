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
  fetchMetaRaces,
  fetchConditions,
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
  fetchMagicAptitudeAdvantageIds,
  fetchMasterEligibleCategories,
  fetchRules,
  fetchAppInfo,
  buildSheet,
  getLastServerTiming,
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
  ["fetchMetaRaces", fetchMetaRaces, "/api/meta-races"],
  ["fetchConditions", fetchConditions, "/api/conditions"],
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
  [
    "fetchMagicAptitudeAdvantageIds",
    fetchMagicAptitudeAdvantageIds,
    "/api/magic/aptitude-advantage-ids",
  ],
  [
    "fetchMasterEligibleCategories",
    fetchMasterEligibleCategories,
    "/api/skills/master-eligible-categories",
  ],
  ["fetchRules", fetchRules, "/api/rules"],
  ["fetchAppInfo", fetchAppInfo, "/api/app-info"],
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

  test("getLastServerTiming() exposes the response's Server-Timing header", async () => {
    mockFetchResponse(
      "/api/sheet/build",
      { sheet: "computed" },
      { headers: { "Server-Timing": "build;dur=1.23" } },
    );

    await buildSheet({});

    expect(getLastServerTiming()).toBe("build;dur=1.23");
  });

  test("getLastServerTiming() is null when the response carries no header", async () => {
    mockFetchResponse("/api/sheet/build", { sheet: "computed" });

    await buildSheet({});

    expect(getLastServerTiming()).toBeNull();
  });

  test("getLastServerTiming() is still captured when the response is an error", async () => {
    mockFetchError("/api/sheet/build", 500, null, {
      headers: { "Server-Timing": "build;dur=4.56" },
    });

    await expect(buildSheet({})).rejects.toThrow();

    expect(getLastServerTiming()).toBe("build;dur=4.56");
  });
});
