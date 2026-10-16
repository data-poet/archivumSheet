const {
  MELEE_TO_RANGED,
  RANGED_TO_MELEE,
  isMeleeDualUse,
  isRangedDualUse,
  getRangedCounterpart,
  getMeleeCounterpart,
  resolveDualUseEnchantmentCategory,
} = require("engine/inventory/js/shared/dualUseWeapons");
const { MELEE, RANGED } = require("tests/helpers/dataRefs");
const { DUAL_USE_WEAPON_PAIRS } = require("helpers/ids.js");

const [LANCA_MELEE_ID, LANCA_RANGED_ID] = DUAL_USE_WEAPON_PAIRS[0];
const [MACHADINHA_MELEE_ID, MACHADINHA_RANGED_ID] = DUAL_USE_WEAPON_PAIRS[10];

describe("DUAL-USE WEAPONS", () => {
  // Lança de Mão, Lança de Arremesso, Machadinha, Machado de Arremesso — 4 dual-use
  // weapons × 5 tiers each. Same two assertions per pair regardless of weapon family,
  // so one parameterized run covers all of them instead of one describe block each.
  describe("Dual-use weapon pairs", () => {
    const TIERS = DUAL_USE_WEAPON_PAIRS;

    test.each(TIERS)("melee %s maps to ranged %s", (meleeId, rangedId) => {
      expect(MELEE_TO_RANGED[meleeId]).toBe(rangedId);
    });

    test.each(TIERS)("ranged %s maps back to melee %s", (meleeId, rangedId) => {
      expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
    });
  });

  describe("isMeleeDualUse", () => {
    test("returns true for all dual-use melee IDs", () => {
      const dualMeleeIds = Object.keys(MELEE_TO_RANGED);
      for (const id of dualMeleeIds) {
        expect(isMeleeDualUse(id)).toBe(true);
      }
    });

    test("returns false for a regular melee weapon", () => {
      expect(isMeleeDualUse(MELEE.foiceCurta)).toBe(false);
    });

    test("returns false for a ranged weapon_id", () => {
      expect(isMeleeDualUse(MACHADINHA_RANGED_ID)).toBe(false);
    });
  });

  describe("isRangedDualUse", () => {
    test("returns true for all dual-use ranged IDs", () => {
      const dualRangedIds = Object.keys(RANGED_TO_MELEE);
      for (const id of dualRangedIds) {
        expect(isRangedDualUse(id)).toBe(true);
      }
    });

    test("returns false for a regular ranged weapon", () => {
      expect(isRangedDualUse(RANGED.arcoCurto)).toBe(false);
    });

    test("returns false for a melee weapon_id", () => {
      expect(isRangedDualUse(MACHADINHA_MELEE_ID)).toBe(false);
    });
  });

  describe("getRangedCounterpart", () => {
    test("returns ranged ID for a dual-use melee weapon", () => {
      expect(getRangedCounterpart(MACHADINHA_MELEE_ID)).toBe(
        MACHADINHA_RANGED_ID,
      );
    });

    test("returns null for a non-dual-use melee weapon", () => {
      expect(getRangedCounterpart(MELEE.foiceCurta)).toBeNull();
    });
  });

  describe("getMeleeCounterpart", () => {
    test("returns melee ID for a dual-use ranged weapon", () => {
      expect(getMeleeCounterpart(LANCA_RANGED_ID)).toBe(LANCA_MELEE_ID);
    });

    test("returns null for a non-dual-use ranged weapon", () => {
      expect(getMeleeCounterpart(RANGED.arcoCurto)).toBeNull();
    });
  });

  describe("resolveDualUseEnchantmentCategory", () => {
    test("returns the own category alone for a non-dual-use weapon", () => {
      expect(
        resolveDualUseEnchantmentCategory(
          MELEE.foiceCurta,
          "Armas Corpo a Corpo",
          "Armas de Longo Alcance",
          isMeleeDualUse,
        ),
      ).toBe("Armas Corpo a Corpo");
    });

    test("returns [own, counterpart] for a dual-use melee weapon", () => {
      expect(
        resolveDualUseEnchantmentCategory(
          MACHADINHA_MELEE_ID,
          "Armas Corpo a Corpo",
          "Armas de Longo Alcance",
          isMeleeDualUse,
        ),
      ).toEqual(["Armas Corpo a Corpo", "Armas de Longo Alcance"]);
    });

    test("returns [own, counterpart] for a dual-use ranged weapon", () => {
      expect(
        resolveDualUseEnchantmentCategory(
          MACHADINHA_RANGED_ID,
          "Armas de Longo Alcance",
          "Armas Corpo a Corpo",
          isRangedDualUse,
        ),
      ).toEqual(["Armas de Longo Alcance", "Armas Corpo a Corpo"]);
    });
  });

  describe("Mapping symmetry", () => {
    test("MELEE_TO_RANGED and RANGED_TO_MELEE have the same number of entries", () => {
      expect(Object.keys(MELEE_TO_RANGED).length).toBe(
        Object.keys(RANGED_TO_MELEE).length,
      );
    });

    test("every MELEE_TO_RANGED entry has a reverse entry in RANGED_TO_MELEE", () => {
      for (const [meleeId, rangedId] of Object.entries(MELEE_TO_RANGED)) {
        expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
      }
    });

    test("one MELEE_TO_RANGED entry per registered dual-use pair", () => {
      expect(Object.keys(MELEE_TO_RANGED).length).toBe(
        DUAL_USE_WEAPON_PAIRS.length,
      );
    });
  });

  describe("Engine DB integration", () => {
    const { _getMeleeDB } = require("engine/inventory/js/melee/melee");
    const { _getRangedDB } = require("engine/inventory/js/ranged/ranged");

    test("every melee ID in MELEE_TO_RANGED exists in the melee DB", () => {
      const meleeDb = _getMeleeDB();
      for (const meleeId of Object.keys(MELEE_TO_RANGED)) {
        expect(meleeDb[meleeId]).toBeDefined();
      }
    });

    test("every ranged ID in RANGED_TO_MELEE exists in the ranged DB", () => {
      const rangedDb = _getRangedDB();
      for (const rangedId of Object.keys(RANGED_TO_MELEE)) {
        expect(rangedDb[rangedId]).toBeDefined();
      }
    });

    test("dual-use ranged weapons have weight = 0 in the ranged DB (canonical weight is on melee side)", () => {
      const rangedDb = _getRangedDB();
      for (const rangedId of Object.keys(RANGED_TO_MELEE)) {
        expect(rangedDb[rangedId].weapon_weight).toBe(0);
      }
    });

    test("dual-use ranged weapons have price = 0 in the ranged DB (canonical price is on melee side)", () => {
      const rangedDb = _getRangedDB();
      for (const rangedId of Object.keys(RANGED_TO_MELEE)) {
        expect(rangedDb[rangedId].weapon_price).toBe(0);
      }
    });
  });
});
