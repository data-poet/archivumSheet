const {
  MELEE_TO_RANGED,
  RANGED_TO_MELEE,
  isMeleeDualUse,
  isRangedDualUse,
  getRangedCounterpart,
  getMeleeCounterpart,
} = require("engine/inventory/js/shared/dualUseWeapons");

describe("DUAL-USE WEAPONS", () => {
  // ── Lança de Mão ─────────────────────────────────────────────────────────
  describe("Lança de Mão", () => {
    const TIERS = [
      ["MELEE-215", "RANGED-055"],
      ["MELEE-216", "RANGED-056"],
      ["MELEE-217", "RANGED-057"],
      ["MELEE-218", "RANGED-058"],
      ["MELEE-219", "RANGED-059"],
    ];

    test.each(TIERS)(
      "melee %s maps to ranged %s",
      (meleeId, rangedId) => {
        expect(MELEE_TO_RANGED[meleeId]).toBe(rangedId);
      },
    );

    test.each(TIERS)(
      "ranged %s maps back to melee %s",
      (meleeId, rangedId) => {
        expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
      },
    );
  });

  // ── Lança de Arremesso ────────────────────────────────────────────────────
  describe("Lança de Arremesso", () => {
    const TIERS = [
      ["MELEE-220", "RANGED-060"],
      ["MELEE-221", "RANGED-061"],
      ["MELEE-222", "RANGED-062"],
      ["MELEE-223", "RANGED-063"],
      ["MELEE-224", "RANGED-064"],
    ];

    test.each(TIERS)(
      "melee %s maps to ranged %s",
      (meleeId, rangedId) => {
        expect(MELEE_TO_RANGED[meleeId]).toBe(rangedId);
      },
    );

    test.each(TIERS)(
      "ranged %s maps back to melee %s",
      (meleeId, rangedId) => {
        expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
      },
    );
  });

  // ── Machadinha ────────────────────────────────────────────────────────────
  describe("Machadinha", () => {
    const TIERS = [
      ["MELEE-280", "RANGED-005"],
      ["MELEE-281", "RANGED-006"],
      ["MELEE-282", "RANGED-007"],
      ["MELEE-283", "RANGED-008"],
      ["MELEE-284", "RANGED-009"],
    ];

    test.each(TIERS)(
      "melee %s maps to ranged %s",
      (meleeId, rangedId) => {
        expect(MELEE_TO_RANGED[meleeId]).toBe(rangedId);
      },
    );

    test.each(TIERS)(
      "ranged %s maps back to melee %s",
      (meleeId, rangedId) => {
        expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
      },
    );
  });

  // ── Machado de Arremesso ──────────────────────────────────────────────────
  describe("Machado de Arremesso", () => {
    const TIERS = [
      ["MELEE-285", "RANGED-010"],
      ["MELEE-286", "RANGED-011"],
      ["MELEE-287", "RANGED-012"],
      ["MELEE-288", "RANGED-013"],
      ["MELEE-289", "RANGED-014"],
    ];

    test.each(TIERS)(
      "melee %s maps to ranged %s",
      (meleeId, rangedId) => {
        expect(MELEE_TO_RANGED[meleeId]).toBe(rangedId);
      },
    );

    test.each(TIERS)(
      "ranged %s maps back to melee %s",
      (meleeId, rangedId) => {
        expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
      },
    );
  });

  // ── isMeleeDualUse ────────────────────────────────────────────────────────
  describe("isMeleeDualUse", () => {
    test("returns true for all dual-use melee IDs", () => {
      const dualMeleeIds = Object.keys(MELEE_TO_RANGED);
      for (const id of dualMeleeIds) {
        expect(isMeleeDualUse(id)).toBe(true);
      }
    });

    test("returns false for a regular melee weapon", () => {
      expect(isMeleeDualUse("MELEE-000")).toBe(false);
    });

    test("returns false for a ranged weapon_id", () => {
      expect(isMeleeDualUse("RANGED-005")).toBe(false);
    });
  });

  // ── isRangedDualUse ───────────────────────────────────────────────────────
  describe("isRangedDualUse", () => {
    test("returns true for all dual-use ranged IDs", () => {
      const dualRangedIds = Object.keys(RANGED_TO_MELEE);
      for (const id of dualRangedIds) {
        expect(isRangedDualUse(id)).toBe(true);
      }
    });

    test("returns false for a regular ranged weapon", () => {
      expect(isRangedDualUse("RANGED-015")).toBe(false);
    });

    test("returns false for a melee weapon_id", () => {
      expect(isRangedDualUse("MELEE-280")).toBe(false);
    });
  });

  // ── getRangedCounterpart ──────────────────────────────────────────────────
  describe("getRangedCounterpart", () => {
    test("returns ranged ID for a dual-use melee weapon", () => {
      expect(getRangedCounterpart("MELEE-280")).toBe("RANGED-005");
    });

    test("returns null for a non-dual-use melee weapon", () => {
      expect(getRangedCounterpart("MELEE-000")).toBeNull();
    });
  });

  // ── getMeleeCounterpart ───────────────────────────────────────────────────
  describe("getMeleeCounterpart", () => {
    test("returns melee ID for a dual-use ranged weapon", () => {
      expect(getMeleeCounterpart("RANGED-055")).toBe("MELEE-215");
    });

    test("returns null for a non-dual-use ranged weapon", () => {
      expect(getMeleeCounterpart("RANGED-015")).toBeNull();
    });
  });

  // ── Mapping symmetry ──────────────────────────────────────────────────────
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

    test("exactly 20 dual-use pairs exist (4 weapons × 5 tiers)", () => {
      expect(Object.keys(MELEE_TO_RANGED).length).toBe(20);
    });
  });

  // ── Engine DB integration ─────────────────────────────────────────────────
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
