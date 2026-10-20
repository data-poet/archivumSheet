const fs = require("fs");
const path = require("path");
const {
  PRIMARY_DEFAULT_VALUE,
  PRIMARY_COST,
  PRIMARY_KEYS,
  POINTS_PER_PURCHASE,
  DEFAULT_SECONDARY_PURCHASE,
  SECONDARY_PURCHASE,
  LOW_RESERVE,
  HP_THRESHOLDS,
  LOAD_LEVELS,
  OVERLOADED,
  LIFT_MULTIPLIERS,
  BASIC_LIFT,
  CONDITION_RULES,
} = require("helpers/rules.js");
const {
  buildPrimaryAttributes,
} = require("engine/character/js/attributes/primary");
const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributes/secondary");

const ENGINE_DIR = path.join(__dirname, "../../../engine");
const ATTRIBUTES_DIR = path.join(ENGINE_DIR, "character/js/attributes");

function codeOf(file) {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join("\n");
}

const primaries = {
  ST: { value: 10 },
  DX: { value: 10 },
  IQ: { value: 10 },
  HT: { value: 10 },
};

describe("primary attribute rules", () => {
  test("values are pinned", () => {
    expect(PRIMARY_DEFAULT_VALUE).toBe(10);
    expect(PRIMARY_COST).toEqual({ ST: 10, DX: 20, IQ: 20, HT: 10 });
    expect(PRIMARY_KEYS).toEqual(["ST", "DX", "IQ", "HT"]);
  });

  test.each(Object.entries(PRIMARY_COST))(
    "%s is charged %i points per level from the default",
    (attr, cost) => {
      const { character_points } = buildPrimaryAttributes({
        [attr]: { base_value: PRIMARY_DEFAULT_VALUE + 2 },
      });
      expect(character_points[attr]).toBe(2 * cost);
    },
  );
});

describe("secondary purchase rules", () => {
  test("values are pinned", () => {
    expect(POINTS_PER_PURCHASE).toBe(5);
    expect(DEFAULT_SECONDARY_PURCHASE).toEqual({ step: 1, maxBought: 5 });
    expect(SECONDARY_PURCHASE).toEqual({
      HP: { step: 4, maxBought: 5 },
      FP: { step: 1, maxBought: 5 },
      Mana: { step: 4, maxBought: 5 },
      Toxicity: { step: 4, maxBought: 5 },
      Will: { step: 1, maxBought: 5 },
      Vision: { step: 1, maxBought: 5 },
      Hearing: { step: 1, maxBought: 5 },
      Smell: { step: 1, maxBought: 5 },
      BasicSpeed: { step: 0.5, maxBought: 6 },
      Movement: { step: 1, maxBought: 0 },
      Dodge: { step: 1, maxBought: 0 },
      DamageResistance: { step: 1, maxBought: 0 },
    });
  });

  test("covers exactly the attributes the engine builds", () => {
    const { attributes } = buildSecondaryAttributes(primaries);
    expect(Object.keys(SECONDARY_PURCHASE).sort()).toEqual(
      Object.keys(attributes).sort(),
    );
  });

  test.each(Object.entries(SECONDARY_PURCHASE))(
    "%s follows its step, cap and point price",
    (attr, { step, maxBought }) => {
      const base = buildSecondaryAttributes(primaries).attributes[attr];
      const bought = buildSecondaryAttributes(primaries, {
        [attr]: { bought: 99 },
      }).attributes[attr];

      expect(bought.bought).toBe(maxBought);
      expect(bought.points).toBe(maxBought * POINTS_PER_PURCHASE);
      if (attr !== "Movement" && attr !== "Dodge") {
        expect(bought.final_base_value - base.final_base_value).toBe(
          step * maxBought,
        );
      }
    },
  );
});

// primary.js and secondary.js must read these numbers from helpers/rules.js, not respell them.
describe("no purchase literal in the attribute builders", () => {
  test.each(["primary.js", "secondary.js"])("%s", (file) => {
    const code = codeOf(path.join(ATTRIBUTES_DIR, file));

    expect(code).not.toMatch(/\bstep\s*[:=]\s*\d/);
    expect(code).not.toMatch(/\bmaxBought\s*[:=]\s*\d/);
    expect(code).not.toMatch(/[bB]ought\s*\*\s*\d/);
    expect(code).not.toMatch(/\b(ST|DX|IQ|HT)\s*:\s*\d/);
  });
});

describe("low-reserve and threshold rules", () => {
  test("values are pinned", () => {
    expect(LOW_RESERVE).toEqual({ keys: ["HP", "FP"], belowDivisor: 3 });
    expect(HP_THRESHOLDS).toEqual({
      majorWoundDivisor: 2,
      headStunDivisor: 3,
      deathCheckMultiples: [1, 2, 3, 4],
      deathMultiple: 5,
      destroyedMultiple: 10,
    });
  });

  test("death checks come before death, and death before destruction", () => {
    const { deathCheckMultiples, deathMultiple, destroyedMultiple } =
      HP_THRESHOLDS;
    expect(Math.max(...deathCheckMultiples)).toBeLessThan(deathMultiple);
    expect(deathMultiple).toBeLessThan(destroyedMultiple);
  });
});

describe("carry rules", () => {
  test("values are pinned", () => {
    expect(BASIC_LIFT).toEqual({ divisor: 10, wholeKgFrom: 5 });
    expect(LIFT_MULTIPLIERS).toEqual({
      oneHanded: 2,
      twoHanded: 8,
      shove: 12,
      onBack: 15,
      shiftSlightly: 50,
    });
    expect(OVERLOADED).toEqual({
      level: "overloaded",
      move_factor: 0,
      dodge_penalty: -4,
    });
    expect(
      LOAD_LEVELS.map(({ level, multiplier, move_factor, dodge_penalty }) => [
        level,
        multiplier,
        move_factor,
        dodge_penalty,
      ]),
    ).toEqual([
      ["none", 1, 1, 0],
      ["light", 2, 0.8, -1],
      ["medium", 3, 0.6, -2],
      ["heavy", 6, 0.4, -3],
      ["veryHeavy", 10, 0.2, -4],
    ]);
  });

  test("heavier levels never move faster or dodge better", () => {
    LOAD_LEVELS.slice(1).forEach((level, i) => {
      const lighter = LOAD_LEVELS[i];
      expect(level.multiplier).toBeGreaterThan(lighter.multiplier);
      expect(level.move_factor).toBeLessThan(lighter.move_factor);
      expect(level.dodge_penalty).toBeLessThan(lighter.dodge_penalty);
    });
  });
});

// The rule numbers must come from helpers/rules.js, not be respelled where they are applied.
describe("no rule literal where the rules are applied", () => {
  const forbidden = {
    "character/js/attributes/thresholds.js": [
      /\/\s*[23]\b/,
      /-\s*\d+\s*\*/,
      /\?\?\s*10\b/,
      /\[\s*1\s*,\s*2/,
      /<\s*4\b/,
    ],
    "character/js/attributes/secondary.js": [/final_base_value\s*\/\s*\d/],
    "inventory/js/carryWeight.js": [
      /final_base_value\s*\/\s*\d/,
      /ST\s*\*\s*ST\)\s*\/\s*\d/,
      />=\s*5\b/,
      /multiplier:\s*\d/,
      /move_factor:\s*[\d.]/,
      /oneHanded:/,
    ],
  };

  test.each(Object.entries(forbidden))("%s", (file, patterns) => {
    const code = codeOf(path.join(ENGINE_DIR, file));
    patterns.forEach((pattern) => expect(code).not.toMatch(pattern));
  });
});

describe("condition rules", () => {
  test("values are pinned", () => {
    expect(CONDITION_RULES).toEqual({
      tagImplies: {
        incapacitated: ["stunned", "cannot_act"],
        unconscious: ["incapacitated"],
      },
      tagPenalties: { stunned: { defense: -4 } },
      painScale: { hipoalgia: 0.5, hiperalgia: 2 },
      attributeRollKinds: {
        ST: ["ST"],
        DX: ["DX"],
        IQ: ["IQ"],
        HT: ["HT"],
        Will: ["Will"],
        Vision: ["Per"],
        Hearing: ["Per"],
        Smell: ["Per"],
      },
    });
  });
});
