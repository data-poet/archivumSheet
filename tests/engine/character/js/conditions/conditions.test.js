const {
  DEFENSE_ROLL,
  SELF_CONTROL_ROLL,
  SENSE_ROLL,
  attributeRollKinds,
  skillRollKinds,
  resolveConditions,
  conditionImmunities,
  rollPenalty,
} = require("engine/character/js/conditions/conditions");
const { CONDITION_RULES } = require("helpers/rules.js");
const { CONDITION_STATUS_TAGS } = require("helpers/taxonomy.js");
const { loadDataset } = require("helpers/datasets.js");
const { withEditedData } = require("tests/helpers/tempData");

const penalty = (keys, kinds, options) =>
  rollPenalty(resolveConditions(keys, options), kinds);

describe("resolveConditions with nothing active", () => {
  test.each([[undefined], [[]]])("%p resolves to empty results", (input) => {
    const resolved = resolveConditions(input);
    expect(resolved).toEqual({
      active: [],
      immune: [],
      dropped: [],
      tags: [],
      modifiers: {},
      recoveries: [],
      reminders: [],
    });
    expect(rollPenalty(resolved, skillRollKinds("DX"))).toBe(0);
  });
});

describe("stacking", () => {
  test("a condition penalizing DX, IQ and skills hits a DX-based skill once", () => {
    expect(penalty(["dor-grave"], skillRollKinds("DX"))).toBe(-4);
  });

  test("an attribute penalty reaches only the skills based on that attribute", () => {
    expect(penalty(["tosse-ou-espirro"], skillRollKinds("DX"))).toBe(-3);
    expect(penalty(["tosse-ou-espirro"], skillRollKinds("IQ"))).toBe(-1);
    expect(penalty(["tosse-ou-espirro"], skillRollKinds("HT"))).toBe(0);
  });

  test("different conditions add up", () => {
    expect(penalty(["nauseado", "dor-grave"], skillRollKinds("IQ"))).toBe(-6);
  });

  test("an all-rolls penalty reaches attribute rolls too", () => {
    expect(penalty(["nauseado"], attributeRollKinds("HT"))).toBe(-2);
    expect(penalty(["nauseado"], attributeRollKinds("DX"))).toBe(-2);
  });

  test("physical and mental stun together cost the defenses -4 once", () => {
    expect(
      penalty(["atordoamento-fisico", "atordoamento-mental"], DEFENSE_ROLL),
    ).toBe(-4);
  });

  test("a defense penalty stacks with the stun one", () => {
    expect(penalty(["atordoamento-fisico", "nauseado"], DEFENSE_ROLL)).toBe(-5);
  });

  test("stun on top of an incapacitating condition is still -4", () => {
    expect(penalty(["atordoamento-fisico", "agonia"], DEFENSE_ROLL)).toBe(-4);
  });

  test("a skill penalty does not leak into the defenses", () => {
    expect(penalty(["dor-grave", "euforia"], DEFENSE_ROLL)).toBe(0);
  });

  test("self-control and sense rolls match their own targets", () => {
    expect(penalty(["embriaguez"], SELF_CONTROL_ROLL)).toBe(-4);
    expect(penalty(["gravemente-nauseado"], SENSE_ROLL)).toBe(-5);
    expect(penalty(["dor-grave"], SENSE_ROLL)).toBe(0);
  });

  test("the summary adds each target across conditions and tags", () => {
    expect(
      resolveConditions(["tosse-ou-espirro", "dor-grave", "agonia"]).modifiers,
    ).toEqual({
      DX: -7,
      IQ: -5,
      skills: -4,
      self_control: -4,
      defense: -4,
    });
  });
});

describe("status tags", () => {
  test("incapacitated implies stunned and cannot_act", () => {
    expect(resolveConditions(["agonia"]).tags).toEqual([
      "cannot_act",
      "incapacitated",
      "stunned",
    ]);
  });

  test("unconscious implies everything incapacitated does", () => {
    expect(resolveConditions(["inconsciencia"]).tags).toEqual([
      "cannot_act",
      "incapacitated",
      "stunned",
      "unconscious",
    ]);
  });

  test("paralysis keeps its own tag next to the implied ones", () => {
    expect(resolveConditions(["paralisia"]).tags).toContain("paralyzed");
  });

  test.each(["alucinacao", "gravemente-nauseado"])(
    "%s can still act, so it is not stunned",
    (key) => {
      expect(resolveConditions([key]).tags).toEqual([]);
    },
  );

  test("every tag a row grants or a rule implies is accounted for", () => {
    const known = new Set([
      ...CONDITION_STATUS_TAGS,
      ...Object.values(CONDITION_RULES.tagImplies).flat(),
    ]);
    Object.entries(CONDITION_RULES.tagImplies).forEach(([tag, implied]) => {
      expect(known.has(tag)).toBe(true);
      implied.forEach((other) => expect(known.has(other)).toBe(true));
    });
    Object.keys(CONDITION_RULES.tagPenalties).forEach((tag) =>
      expect(known.has(tag)).toBe(true),
    );
  });
});

describe("validation", () => {
  test("the first of an exclusive group wins and the rest are dropped", () => {
    const resolved = resolveConditions(["dor-moderada", "dor-grave"]);
    expect(resolved.active.map((c) => c.key)).toEqual(["dor-moderada"]);
    expect(resolved.dropped).toEqual([
      { key: "dor-grave", reason: "exclusive", kept: "dor-moderada" },
    ]);
  });

  test("conditions of different groups do not exclude each other", () => {
    expect(
      resolveConditions(["dor-grave", "embriaguez", "nauseado"]).dropped,
    ).toEqual([]);
  });

  test("an unknown key is dropped and reported", () => {
    const resolved = resolveConditions(["nao-existe", "coma"]);
    expect(resolved.dropped).toEqual([
      { key: "nao-existe", reason: "unknown" },
    ]);
    expect(resolved.active.map((c) => c.key)).toEqual(["coma"]);
  });

  test("a repeated key counts once", () => {
    expect(penalty(["dor-grave", "dor-grave"], skillRollKinds("DX"))).toBe(-4);
  });

  test("active conditions come back in dataset order whatever the input order", () => {
    const resolved = resolveConditions([
      "coma",
      "atordoamento-mental",
      "dor-grave",
    ]);
    const order = loadDataset("CONDITIONS").map((row) => row.condition_key);
    const indexes = resolved.active.map((c) => order.indexOf(c.key));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });
});

describe("immunity", () => {
  const immunityTraitIds = {
    "nao-respira": "ADV-136",
    "tolerancia-a-ferimentos-homogeneo": "ADV-128",
    "estraga-prazeres": "DIS-900",
  };

  test("a character with the trait ignores the condition and says why", () => {
    const resolved = resolveConditions(["sufocamento", "nauseado"], {
      traitIds: ["ADV-136"],
      immunityTraitIds,
    });
    expect(resolved.active.map((c) => c.key)).toEqual(["nauseado"]);
    expect(resolved.immune).toEqual([
      expect.objectContaining({
        key: "sufocamento",
        trait_key: "nao-respira",
        trait_name: expect.any(String),
      }),
    ]);
    expect(resolved.tags).toEqual([]);
  });

  test("any one of several traits is enough", () => {
    const resolved = resolveConditions(["sufocamento"], {
      traitIds: ["ADV-128"],
      immunityTraitIds,
    });
    expect(resolved.immune[0].trait_key).toBe(
      "tolerancia-a-ferimentos-homogeneo",
    );
  });

  test("a trait the character lacks grants nothing", () => {
    const resolved = resolveConditions(["sufocamento"], {
      traitIds: ["ADV-001"],
      immunityTraitIds,
    });
    expect(resolved.immune).toEqual([]);
    expect(resolved.active).toHaveLength(1);
  });

  test("a pending trait key (no row) makes nobody immune", () => {
    const resolved = resolveConditions(["extase"], {
      traitIds: ["DIS-900"],
      immunityTraitIds: {},
    });
    expect(resolved.immune).toEqual([]);
    expect(resolved.active.map((c) => c.key)).toEqual(["extase"]);
  });

  test("the trait name is null when the id has no row", () => {
    const resolved = resolveConditions(["extase"], {
      traitIds: ["DIS-900"],
      immunityTraitIds,
    });
    expect(resolved.immune[0].trait_name).toBeNull();
  });
});

describe("recoveries and reminders", () => {
  test("mental stun recovers on Will or IQ every turn", () => {
    expect(resolveConditions(["atordoamento-mental"]).recoveries).toEqual([
      {
        key: "atordoamento-mental",
        attributes: ["Will", "IQ"],
        interval: "turn",
      },
    ]);
  });

  test("a condition without a recovery roll adds none", () => {
    expect(resolveConditions(["tosse-ou-espirro"]).recoveries).toEqual([]);
  });

  test("reminders carry the text of what the engine does not automate", () => {
    expect(resolveConditions(["agonia"]).reminders).toEqual([
      { key: "agonia", text: expect.stringContaining("1 PF por minuto") },
    ]);
  });

  test("a condition with no reminder adds none", () => {
    expect(resolveConditions(["euforia"]).reminders).toEqual([]);
  });
});

describe("conditionImmunities", () => {
  const immunityTraitIds = {
    "nao-respira": "ADV-136",
    "tolerancia-a-ferimentos-homogeneo": "ADV-128",
    "tolerancia-a-ferimentos-difuso": "ADV-127",
  };

  test("lists every condition a trait grants immunity to, switched on or not", () => {
    const keys = conditionImmunities(["ADV-128"], { immunityTraitIds }).map(
      (entry) => entry.key,
    );
    expect(keys).toEqual(["sufocamento", "ataque-cardiaco"]);
  });

  test("names the trait that grants each one", () => {
    const [sufocamento] = conditionImmunities(["ADV-136"], {
      immunityTraitIds,
    });
    expect(sufocamento).toEqual({
      key: "sufocamento",
      trait_key: "nao-respira",
      trait_name: expect.any(String),
    });
  });

  test("a character with no immunity trait has none", () => {
    expect(conditionImmunities(["ADV-001"], { immunityTraitIds })).toEqual([]);
    expect(conditionImmunities([], { immunityTraitIds })).toEqual([]);
    expect(conditionImmunities()).toEqual([]);
  });

  test("a trait key with no row (pending) grants nothing", () => {
    expect(conditionImmunities(["DIS-900"], { immunityTraitIds: {} })).toEqual(
      [],
    );
  });
});

describe("pain threshold", () => {
  const painThresholdTraitIds = { hipoalgia: "ADV-049", hiperalgia: "DIS-034" };
  const resolve = (keys, traitIds, options = {}) =>
    resolveConditions(keys, { traitIds, painThresholdTraitIds, ...options });

  test("Hipoalgia halves every target of a pain condition and reports the scale", () => {
    const [pain] = resolve(["dor-grave"], ["ADV-049"]).active;

    expect(pain.targets).toEqual({
      DX: -2,
      IQ: -2,
      skills: -2,
      self_control: -2,
    });
    expect(pain.scale).toBe(0.5);
  });

  test("Hiperalgia doubles it", () => {
    const [pain] = resolve(["dor-grave"], ["DIS-034"]).active;

    expect(pain.targets).toEqual({
      DX: -8,
      IQ: -8,
      skills: -8,
      self_control: -8,
    });
    expect(pain.scale).toBe(2);
  });

  test("a character with both gets neither, and no scale is reported", () => {
    const [pain] = resolve(["dor-grave"], ["ADV-049", "DIS-034"]).active;

    expect(pain.targets.DX).toBe(-4);
    expect("scale" in pain).toBe(false);
  });

  test("without either trait nothing changes", () => {
    const [pain] = resolve(["dor-grave"], ["ADV-001"]).active;

    expect(pain.targets.DX).toBe(-4);
    expect("scale" in pain).toBe(false);
  });

  test("only the conditions flagged as pain are scaled", () => {
    const resolved = resolve(["euforia", "nauseado", "agonia"], ["ADV-049"]);

    expect(resolved.active.map((c) => [c.key, c.scale])).toEqual([
      ["euforia", undefined],
      ["nauseado", undefined],
      ["agonia", undefined],
    ]);
    expect(resolved.active.find((c) => c.key === "euforia").targets.DX).toBe(
      -3,
    );
  });

  test("the roll penalty and the summary follow the scaled numbers", () => {
    const resolved = resolve(["dor-grave"], ["DIS-034"]);

    expect(rollPenalty(resolved, skillRollKinds("DX"))).toBe(-8);
    expect(resolved.modifiers).toEqual({
      DX: -8,
      IQ: -8,
      skills: -8,
      self_control: -8,
    });
  });

  test("a pending trait key (no row) scales nothing, even when its id is owned", () => {
    const [pain] = resolveConditions(["dor-grave"], {
      traitIds: ["ADV-049", "DIS-034"],
      painThresholdTraitIds: {},
    }).active;

    expect(pain.targets.DX).toBe(-4);
  });

  test("an odd penalty rounds toward zero when halved, and a penalty of 1 drops out", () => {
    const [pain] = withEditedData(
      "db_conditions.csv",
      (rows) => {
        const row = rows.find((r) => r.condition_key === "dor-moderada");
        row.condition_dx_modifier = "-3";
        row.condition_iq_modifier = "-1";
        return rows;
      },
      () => resolve(["dor-moderada"], ["ADV-049"]).active,
    );

    expect(pain.targets.DX).toBe(-1);
    expect("IQ" in pain.targets).toBe(false);
  });
});
