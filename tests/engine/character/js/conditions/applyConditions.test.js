const {
  applyConditions,
} = require("engine/character/js/conditions/applyConditions");
const { criticalRanges } = require("helpers/criticalRanges.js");
const { ADVANTAGE } = require("tests/helpers/dataRefs");

function check(skill_id, level, parry) {
  return { skill_id, level, parry, critical: criticalRanges(level) };
}

function parts() {
  return {
    characterData: {
      advantages: {},
      disadvantages: {},
      primary_attributes: {
        ST: { value: 10 },
        DX: { value: 12 },
        IQ: { value: 11 },
        HT: { value: 10 },
      },
      secondary_attributes: {
        Will: { value: 11 },
        Vision: { value: 11 },
        Hearing: { value: 11 },
        Smell: { value: 11 },
        Dodge: { value: 8 },
      },
      skills: {
        dx: {
          attribute: "DX",
          value: 16,
          critical: criticalRanges(16),
          parry: 11,
        },
        iq: {
          attribute: "IQ",
          value: 13,
          critical: criticalRanges(13),
          parry: null,
        },
      },
      unarmed: [check(null, 12, 9)],
    },
    grimoire: { fireball: { value: 14, critical: criticalRanges(14) } },
    inventory: {
      melee: { equipped: [{ skill_check: check("SK-DX", 14, 10) }], stash: [] },
      ranged: {
        equipped: [],
        stash: [{ skill_check: check("SK-DX", 13, null) }],
      },
      shield: {
        equipped: { skill_check: check("SK-SH", 12, null), block: 9 },
        stash: [{ skill_check: check("SK-SH", 10, null), block: 8 }],
      },
    },
    skillRows: {
      "SK-DX": { skill_base_attribute: "DX" },
      "SK-SH": { skill_base_attribute: "DX" },
    },
  };
}

function apply(activeKeys, overrides = {}) {
  const input = { ...parts(), ...overrides };
  applyConditions({ activeKeys, ...input });
  return input;
}

describe("applyConditions with nothing active", () => {
  test.each([[undefined], [null], [[]]])(
    "%p leaves the sheet untouched",
    (keys) => {
      expect(apply(keys)).toEqual(parts());
    },
  );
});

describe("a skill and attribute penalty (Dor Grave)", () => {
  const result = apply(["dor-grave"]);
  const { primary_attributes: primary } = result.characterData;

  test("DX and IQ rolls take it; the stored value stays", () => {
    expect(primary.DX).toEqual({
      value: 12,
      condition_modifier: -4,
      effective_value: 8,
    });
    expect(primary.IQ.effective_value).toBe(7);
  });

  test("ST and HT rolls are unaffected: it names DX, IQ and skills only", () => {
    expect(primary.ST).toEqual({ value: 10 });
    expect(primary.HT).toEqual({ value: 10 });
  });

  test("every skill takes it once, whatever its attribute", () => {
    const { skills } = result.characterData;
    expect(skills.dx.effective_value).toBe(12);
    expect(skills.iq.effective_value).toBe(9);
  });

  test("the critical range follows the effective level, not the stored one", () => {
    const { dx } = result.characterData.skills;
    expect(criticalRanges(16).success).toBe(6);
    expect(dx.critical).toEqual(criticalRanges(12));
    expect(dx.value).toBe(16);
  });

  test("spells, unarmed and weapon checks take it", () => {
    expect(result.grimoire.fireball.effective_value).toBe(10);
    expect(result.characterData.unarmed[0].effective_level).toBe(8);
    expect(result.inventory.melee.equipped[0].skill_check.effective_level).toBe(
      10,
    );
    expect(result.inventory.ranged.stash[0].skill_check.effective_level).toBe(
      9,
    );
  });

  test("Parry, Block and Dodge are not touched: no double count", () => {
    const { characterData, inventory } = result;
    expect(characterData.skills.dx.effective_parry).toBeUndefined();
    expect(characterData.unarmed[0].effective_parry).toBeUndefined();
    expect(
      inventory.melee.equipped[0].skill_check.effective_parry,
    ).toBeUndefined();
    expect(inventory.shield.equipped.effective_block).toBeUndefined();
    expect(characterData.secondary_attributes.Dodge).toEqual({ value: 8 });
  });
});

describe("stun (a defense penalty)", () => {
  const result = apply(["atordoamento-fisico", "atordoamento-mental"]);

  test("Dodge takes -4 once, even with both stuns", () => {
    expect(result.characterData.secondary_attributes.Dodge).toEqual({
      value: 8,
      condition_modifier: -4,
      effective_value: 4,
    });
  });

  test("Parry from skills, unarmed and weapons takes -4; a missing Parry stays missing", () => {
    const { characterData, inventory } = result;
    expect(characterData.skills.dx.effective_parry).toBe(7);
    expect(characterData.skills.iq.effective_parry).toBeUndefined();
    expect(characterData.unarmed[0].effective_parry).toBe(5);
    expect(inventory.melee.equipped[0].skill_check.effective_parry).toBe(6);
    expect(
      inventory.ranged.stash[0].skill_check.effective_parry,
    ).toBeUndefined();
  });

  test("Block takes -4 on the equipped shield and on stored ones", () => {
    expect(result.inventory.shield.equipped.effective_block).toBe(5);
    expect(result.inventory.shield.stash[0].effective_block).toBe(4);
  });

  test("rolls are untouched: stun is a defense penalty only", () => {
    const { characterData } = result;
    expect(
      characterData.primary_attributes.DX.condition_modifier,
    ).toBeUndefined();
    expect(characterData.skills.dx.condition_modifier).toBeUndefined();
    expect(characterData.skills.dx.effective_value).toBeUndefined();
  });
});

describe("an all-rolls penalty (Nauseado)", () => {
  const result = apply(["nauseado"]);

  test("reaches every attribute roll, Will and the senses", () => {
    const { primary_attributes: primary, secondary_attributes: secondary } =
      result.characterData;
    ["ST", "DX", "IQ", "HT"].forEach((key) =>
      expect(primary[key].condition_modifier).toBe(-2),
    );
    ["Will", "Vision", "Hearing", "Smell"].forEach((key) =>
      expect(secondary[key].condition_modifier).toBe(-2),
    );
  });

  test("takes -1 off the defenses on top", () => {
    expect(
      result.characterData.secondary_attributes.Dodge.effective_value,
    ).toBe(7);
    expect(result.characterData.unarmed[0].effective_parry).toBe(8);
  });
});

describe("what an IQ or Per penalty reaches", () => {
  test("an IQ penalty does not reach Will or the senses", () => {
    const { secondary_attributes: secondary } = apply([
      "tosse-ou-espirro",
    ]).characterData;
    expect(secondary.Will).toEqual({ value: 11 });
    expect(secondary.Vision).toEqual({ value: 11 });
  });

  test("a Per penalty reaches the three senses only", () => {
    const { primary_attributes: primary, secondary_attributes: secondary } =
      apply(["gravemente-nauseado"]).characterData;
    ["Vision", "Hearing", "Smell"].forEach((key) =>
      expect(secondary[key].effective_value).toBe(6),
    );
    expect(secondary.Will.condition_modifier).toBeUndefined();
    expect(primary.HT.condition_modifier).toBeUndefined();
    expect(primary.DX.effective_value).toBe(7);
  });
});

describe("the conditions summary", () => {
  test("is attached once something is requested, with what was dropped", () => {
    const { conditions } = apply([
      "dor-grave",
      "dor-moderada",
      "nao-existe",
    ]).characterData;
    expect(conditions.active.map((c) => c.key)).toEqual(["dor-grave"]);
    expect(conditions.dropped.map((d) => d.reason).sort()).toEqual([
      "exclusive",
      "unknown",
    ]);
  });

  test("an immune character gets nothing applied and the reason listed", () => {
    const characterData = {
      ...parts().characterData,
      advantages: { [ADVANTAGE.naoRespira]: {} },
    };
    const result = apply(["sufocamento"], { characterData });
    expect(result.characterData.conditions.immune[0].trait_key).toBe(
      "nao-respira",
    );
    expect(result.characterData.conditions.tags).toEqual([]);
    expect(result.characterData.secondary_attributes.Dodge).toEqual({
      value: 8,
    });
  });
});
