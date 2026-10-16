const fs = require("fs");
const path = require("path");
const {
  PRIMARY_DEFAULT_VALUE,
  PRIMARY_COST,
  POINTS_PER_PURCHASE,
  DEFAULT_SECONDARY_PURCHASE,
  SECONDARY_PURCHASE,
} = require("helpers/rules.js");
const {
  buildPrimaryAttributes,
} = require("engine/character/js/attributes/primary");
const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributes/secondary");

const ATTRIBUTES_DIR = path.join(
  __dirname,
  "../../../engine/character/js/attributes",
);

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
    const code = fs
      .readFileSync(path.join(ATTRIBUTES_DIR, file), "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\*)/.test(line))
      .join("\n");

    expect(code).not.toMatch(/\bstep\s*[:=]\s*\d/);
    expect(code).not.toMatch(/\bmaxBought\s*[:=]\s*\d/);
    expect(code).not.toMatch(/[bB]ought\s*\*\s*\d/);
    expect(code).not.toMatch(/\b(ST|DX|IQ|HT)\s*:\s*\d/);
  });
});
