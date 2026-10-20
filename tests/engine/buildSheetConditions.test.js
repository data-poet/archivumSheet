const {
  ADVANTAGE,
  DISADVANTAGE,
  RANGED,
  SHIELD,
  SKILL,
} = require("tests/helpers/dataRefs");
const { loadDataset } = require("helpers/datasets.js");
const { CONDITION_RULES } = require("helpers/rules.js");
const { buildSheet } = require("engine/buildSheet");
const { computeParry } = require("engine/character/js/skills/skillCheck");

const baseInput = {
  character: {
    advantages: [],
    disadvantages: [],
    primaryAttributes: { ST: {}, HT: {}, IQ: {}, DX: {} },
    secondaryAttributes: {},
    skills: [{ skill_id: SKILL.corrida, base_value: 12, modifier: 0 }],
  },
  inventory: {
    weight: 0,
    shield: [
      {
        id: "sh-1",
        shield_id: SHIELD.escudoTorre,
        is_equipped: true,
        storedAt: null,
      },
    ],
    ranged: [
      {
        id: "rng-1",
        weapon_id: RANGED.facaDeArremessoBoa,
        is_equipped: true,
        storedAt: null,
      },
    ],
  },
};

function build(conditions, overrides = {}) {
  return buildSheet({
    ...baseInput,
    character: { ...baseInput.character, conditions, ...overrides },
  });
}

describe("buildSheet with conditions", () => {
  test.each([[undefined], [[]]])(
    "no flags (%p) builds a sheet identical to one without the feature",
    (conditions) => {
      const sheet = build(conditions);
      expect(JSON.stringify(sheet)).toBe(JSON.stringify(build(undefined)));
      expect(JSON.stringify(sheet)).not.toMatch(
        /condition_modifier|effective_|"conditions"/,
      );
    },
  );

  test("pain lowers the rolls and leaves Parry and Block as they were", () => {
    const base = build([]);
    const pained = build(["dor-grave"]);
    const { character } = pained;

    expect(character.primary_attributes.DX.effective_value).toBe(
      base.character.primary_attributes.DX.value - 4,
    );
    expect(character.primary_attributes.DX.value).toBe(
      base.character.primary_attributes.DX.value,
    );

    const run = character.skills[SKILL.corrida];
    expect(run.value).toBe(12);
    expect(run.effective_value).toBe(8);

    expect(character.unarmed[0].parry).toBe(base.character.unarmed[0].parry);
    expect(character.unarmed[0].effective_parry).toBeUndefined();
    expect(pained.inventory.shield.equipped.block).toBe(
      base.inventory.shield.equipped.block,
    );
    expect(pained.inventory.shield.equipped.effective_block).toBeUndefined();
  });

  test("a skill penalty never leaks into Parry through the skill level", () => {
    const { character } = build(["euforia"], {
      skills: [{ skill_id: SKILL.bastao, base_value: 14, modifier: 0 }],
    });
    const skill = character.skills[SKILL.bastao];
    const row = loadDataset("SKILLS").find((r) => r.skill_id === SKILL.bastao);

    expect(skill.parry).not.toBeNull();
    expect(skill.effective_value).toBe(11);
    expect(skill.parry).toBe(computeParry(row, 14, false));
    expect(skill.effective_parry).toBeUndefined();
  });

  test("stun takes 4 off Dodge, Parry and Block, once even with both stuns", () => {
    const base = build([]);
    const stunned = build(["atordoamento-fisico", "atordoamento-mental"]);
    const { character, inventory } = stunned;

    expect(character.secondary_attributes.Dodge.effective_value).toBe(
      base.character.secondary_attributes.Dodge.value - 4,
    );
    expect(character.unarmed[0].effective_parry).toBe(
      base.character.unarmed[0].parry - 4,
    );
    expect(inventory.shield.equipped.effective_block).toBe(
      base.inventory.shield.equipped.block - 4,
    );
    expect(character.skills[SKILL.corrida].effective_value).toBeUndefined();
    expect(character.conditions.tags).toEqual(["stunned"]);
  });

  test("reserve halving comes first, then the penalty", () => {
    const hp = build([]).character.secondary_attributes.HP.final_base_value;
    const reeling = { secondaryAttributes: { HP: { modifier: -(hp - 3) } } };

    const halved = build([], reeling).character.secondary_attributes.Dodge;
    const stunned = build(["atordoamento-fisico"], reeling).character
      .secondary_attributes.Dodge;

    expect(halved.value).toBeLessThan(
      build([]).character.secondary_attributes.Dodge.value,
    );
    expect(stunned.value).toBe(halved.value);
    expect(stunned.effective_value).toBe(halved.value - 4);
  });

  test("an unknown key is reported, not an error", () => {
    const { conditions } = build(["nao-existe"]).character;
    expect(conditions.active).toEqual([]);
    expect(conditions.dropped).toEqual([
      { key: "nao-existe", reason: "unknown" },
    ]);
  });

  test("a character with Não Respira ignores Sufocamento and still takes the rest", () => {
    const { conditions } = build(["sufocamento", "nauseado"], {
      advantages: [ADVANTAGE.naoRespira],
    }).character;
    expect(conditions.active.map((c) => c.key)).toEqual(["nauseado"]);
    expect(conditions.immune.map((c) => c.key)).toEqual(["sufocamento"]);
  });

  test("the sheet stays JSON-serializable", () => {
    const sheet = build(["atordoamento-mental", "dor-grave", "sufocamento"]);
    expect(JSON.parse(JSON.stringify(sheet)).character.conditions).toEqual(
      sheet.character.conditions,
    );
  });

  test("Hipoalgia halves a pain condition and Hiperalgia doubles it, through the whole sheet", () => {
    const dx = (overrides) =>
      build(["dor-grave"], overrides).character.primary_attributes.DX;

    expect(dx({}).condition_modifier).toBe(-4);
    expect(dx({ advantages: [ADVANTAGE.hipoalgia] }).condition_modifier).toBe(
      -2,
    );
    expect(
      dx({ disadvantages: [DISADVANTAGE.hiperalgia] }).condition_modifier,
    ).toBe(-8);
    expect(
      dx({
        advantages: [ADVANTAGE.hipoalgia],
        disadvantages: [DISADVANTAGE.hiperalgia],
      }).condition_modifier,
    ).toBe(-4);
  });

  test("shock lowers DX and IQ but not HT, an HT-based skill, or the defenses", () => {
    const base = build([]);
    const shocked = build(["choque-4"]);
    const { character, inventory } = shocked;

    expect(character.primary_attributes.DX.condition_modifier).toBe(-4);
    expect(character.primary_attributes.IQ.condition_modifier).toBe(-4);
    expect(character.primary_attributes.HT.condition_modifier).toBeUndefined();
    expect(character.skills[SKILL.corrida].condition_modifier).toBeUndefined();
    expect(
      character.secondary_attributes.Dodge.effective_value,
    ).toBeUndefined();
    expect(character.unarmed[0].parry).toBe(base.character.unarmed[0].parry);
    expect(character.unarmed[0].effective_parry).toBeUndefined();
    expect(inventory.shield.equipped.effective_block).toBeUndefined();
  });

  test("every attribute in the roll table is a real entry of the built sheet", () => {
    const { primary_attributes: primary, secondary_attributes: secondary } =
      build(["nauseado"]).character;

    Object.keys(CONDITION_RULES.attributeRollKinds).forEach((key) => {
      const entry = primary[key] ?? secondary[key];
      expect(entry).toBeDefined();
      expect(entry.condition_modifier).toBe(-2);
    });
  });
});
