import fs from "fs";
import path from "path";

const {
  calculateDamage,
} = require("engine/character/js/attributes/baseDamage");
const { calculateCarryWeight } = require("engine/inventory/js/carryWeight");
const {
  buildPrimaryAttributes,
} = require("engine/character/js/attributes/primary");
const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributes/secondary");

// The attributes tabs document engine behaviour; these fail when the engine and the text drift apart.
// Runs of spaces collapse so Prettier's table padding doesn't matter.
const read = (file) =>
  fs
    .readFileSync(
      path.join(
        __dirname,
        "../../../dev/public/reference-content/attributes",
        file,
      ),
      "utf8",
    )
    .replace(/ {2,}/g, " ");

function formatDamage({ dice, base_modifier: mod }) {
  if (dice === "0d6") return "—";
  if (mod === 0) return dice;
  return `${dice}${mod > 0 ? "+" : ""}${mod}`;
}

describe("base_damage.md", () => {
  const rows = [
    ...read("base_damage.md").matchAll(
      /^\| \*\*(\d+)\*\* \| (\S+) \| (\S+) \|$/gm,
    ),
  ];

  test("lists every ST from 1 to 31, then every listed key through 100", () => {
    expect(rows.map((r) => Number(r[1]))).toEqual([
      ...Array.from({ length: 31 }, (_, i) => i + 1),
      33,
      35,
      37,
      39,
      45,
      50,
      55,
      60,
      65,
      70,
      75,
      80,
      85,
      90,
      95,
      100,
    ]);
  });

  test.each(rows.map((r) => [Number(r[1]), r[2], r[3]]))(
    "ST %i matches the engine (GDP %s, BAL %s)",
    (st, gdp, bal) => {
      const damage = calculateDamage(st);
      expect(formatDamage(damage.GDP)).toBe(gdp);
      expect(formatDamage(damage.BAL)).toBe(bal);
    },
  );

  test("an ST between listed keys uses the row below, as the text says", () => {
    expect(calculateDamage(32)).toEqual(calculateDamage(31));
  });

  test("the above-100 example matches the engine", () => {
    const damage = calculateDamage(125);
    expect(read("base_damage.md")).toContain(
      `ST 125: GDP **${damage.GDP.dice}** e BAL **${damage.BAL.dice}**`,
    );
  });
});

describe("carry_and_movement.md", () => {
  const markdown = read("carry_and_movement.md");
  const { calculateBasicLift } = require("engine/inventory/js/carryWeight");
  const levels = [
    ["Nenhuma", 1, "×1", 0],
    ["Leve", 2, "×0,8", -1],
    ["Média", 3, "×0,6", -2],
    ["Pesada", 6, "×0,4", -3],
    ["Muito Pesada", 10, "×0,2", -4],
  ];

  test("Basic Lift examples match the engine", () => {
    expect(calculateBasicLift(10)).toBe(10);
    expect(calculateBasicLift(12)).toBe(14);
    expect(calculateBasicLift(7)).toBe(4.9);
    expect(markdown).toContain("arredondado para **14** kg");
    expect(markdown).toContain("4{,}9$ kg, sem arredondar");
  });

  test.each(levels)(
    "%s: up to %i × CB, Deslocamento %s, Esquiva %i",
    (name, multiplier, factor, penalty) => {
      const bl = calculateBasicLift(12);
      const atLimit = calculateCarryWeight(12, bl * multiplier);
      expect(atLimit.limits[atLimit.level]).toBe(bl * multiplier);
      expect(String(atLimit.move_factor).replace(".", ",")).toBe(
        factor.slice(1),
      );
      expect(atLimit.dodge_penalty).toBe(penalty);
      const label = multiplier === 1 ? "**CB**" : `**${multiplier} × CB**`;
      expect(markdown).toContain(
        `| ${name} | até ${label} | **${factor}** | **${penalty}** |`,
      );
    },
  );

  test("over 10 × CB the character can't move", () => {
    const overloaded = calculateCarryWeight(12, 141);
    expect(overloaded.move_factor).toBe(0);
    expect(overloaded.dodge_penalty).toBe(-4);
    expect(markdown).toContain(
      "| Acima do limite | mais de **10 × CB** | não se move | **-4** |",
    );
  });

  test("the ST 12 example rows match the engine", () => {
    const primaries = {
      ST: { value: 12 },
      DX: { value: 12 },
      IQ: { value: 12 },
      HT: { value: 11 },
    };
    const bl = calculateBasicLift(12);
    levels.forEach(([name, multiplier]) => {
      const carry = calculateCarryWeight(12, bl * multiplier);
      const { Movement, Dodge } = buildSecondaryAttributes(
        primaries,
        {},
        carry,
      ).attributes;
      expect(markdown).toContain(
        `| ${name} | ${bl * multiplier} | ${Movement.value} | ${Dodge.value} |`,
      );
    });
  });

  test.each([
    ["oneHanded", "Erguer com uma mão (1 segundo)", 2],
    ["twoHanded", "Erguer com as duas mãos (4 segundos)", 8],
    ["shove", "Empurrar ou derrubar", 12],
    ["onBack", "Carregar nas costas", 15],
    ["shiftSlightly", "Arrastar um pouco (no chão, com esforço)", 50],
  ])(
    "lift %s is %s = %i × CB in the engine and the text",
    (key, label, multiplier) => {
      expect(calculateCarryWeight(10, 0).lifts[key]).toBe(10 * multiplier);
      expect(markdown).toContain(`| ${label} | **${multiplier} × CB** |`);
    },
  );
});

describe("points_and_buying.md", () => {
  const markdown = read("points_and_buying.md");

  test.each([
    ["ST", 10],
    ["DX", 20],
    ["IQ", 20],
    ["HT", 10],
  ])("%s costs %i per level above 10", (attr, cost) => {
    const { character_points } = buildPrimaryAttributes({
      [attr]: { base_value: 11 },
    });
    expect(character_points[attr]).toBe(cost);
    expect(markdown).toContain(`| [[${attr}]] | **${cost}** |`);
  });

  const primaries = {
    ST: { value: 10 },
    DX: { value: 12 },
    IQ: { value: 12 },
    HT: { value: 11 },
  };

  test.each([
    ["HP", 4, 5],
    ["Mana", 4, 5],
    ["Toxicity", 4, 5],
    ["BasicSpeed", 0.5, 6],
    ["FP", 1, 5],
    ["Will", 1, 5],
    ["Vision", 1, 5],
    ["Hearing", 1, 5],
    ["Smell", 1, 5],
  ])(
    "%s: +%s per purchase, at most %i purchases, 5 points each",
    (attr, step, max) => {
      const base = buildSecondaryAttributes(primaries).attributes[attr];
      const bought = buildSecondaryAttributes(primaries, {
        [attr]: { bought: 99 },
      }).attributes[attr];
      expect(bought.bought).toBe(max);
      expect(bought.final_base_value - base.final_base_value).toBe(step * max);
      expect(bought.points).toBe(max * 5);
    },
  );

  test("Movement, Dodge and DamageResistance cannot be bought", () => {
    const { attributes } = buildSecondaryAttributes(primaries, {
      DamageResistance: { bought: 3 },
      Dodge: { bought: 3 },
    });
    expect(attributes.DamageResistance.bought).toBe(0);
    expect(attributes.Dodge.bought).toBe(0);
    expect(attributes.Movement.bought).toBe(0);
    expect(markdown).toContain(
      "| [[Deslocamento]], [[Esquiva]], [[RD]] | não pode ser comprado | — |",
    );
  });
});

describe("secondary.md worked examples (ST 10, DX 12, IQ 12, HT 11)", () => {
  const markdown = read("secondary.md");
  const primaries = {
    ST: { value: 10 },
    DX: { value: 12 },
    IQ: { value: 12 },
    HT: { value: 11 },
  };
  const { attributes } = buildSecondaryAttributes(primaries);

  test("PV, Mana and Toxicidade results match the engine", () => {
    expect(markdown).toContain(`\\right\\rfloor = ${attributes.HP.value}\n`);
    expect(markdown).toContain(`\\right\\rfloor = ${attributes.Mana.value}\n`);
    expect(markdown).toContain(
      `\\right\\rfloor = ${attributes.Toxicity.value}\n`,
    );
  });

  test("VB, Deslocamento and Esquiva without load match the engine", () => {
    expect(attributes.BasicSpeed.value).toBe(5.75);
    expect(markdown).toContain("= 5{,}75");
    expect(markdown).toContain(
      `\\lfloor 5{,}75 \\rfloor = ${attributes.Movement.value}$ m/s`,
    );
    expect(markdown).toContain(`$5 + 4 = ${attributes.Dodge.value}$`);
    const {
      calculateCarryWeight: carryFor,
    } = require("engine/inventory/js/carryWeight");
    const medium = buildSecondaryAttributes(
      primaries,
      {},
      carryFor(10, 30),
    ).attributes;
    expect(markdown).toContain(
      `\\lfloor 5 \\times 0{,}6 \\rfloor = ${medium.Movement.value}$ m/s`,
    );
    expect(markdown).toContain(`$5 + 4 - 2 = ${medium.Dodge.value}$`);
  });

  test("PF equals HT, and below 1/3 PF Deslocamento and Esquiva halve", () => {
    expect(attributes.FP.value).toBe(11);
    expect(markdown).toContain("Com **HT 11**, o personagem tem **11** PF");
    const exhausted = buildSecondaryAttributes(primaries, {
      FP: { modifier: -8 },
    }).attributes;
    expect(exhausted.Movement.value).toBe(3);
    expect(exhausted.Dodge.value).toBe(5);
    expect(markdown).toContain(
      "o Deslocamento passa de 5 para **3** e a Esquiva de 9 para **5**",
    );
  });

  test("below 1/3 PV, Deslocamento and Esquiva halve (round up) and VB stays", () => {
    const wounded = buildSecondaryAttributes(primaries, {
      HP: { modifier: -22 },
    }).attributes;
    expect(wounded.BasicSpeed.value).toBe(5.75);
    expect(wounded.Movement.value).toBe(3);
    expect(wounded.Dodge.value).toBe(5);
    expect(markdown).toContain(
      "o Deslocamento passa de 5 para **3** e a Esquiva de 9 para **5**",
    );
  });
});

describe("elemental_resistances.md", () => {
  const {
    ELEMENTAL_TYPES,
  } = require("engine/character/js/attributes/elementalResistances");
  const {
    ELEMENTAL_RESISTANCES,
  } = require("dev/public/js/localization/pt-BR/components/resistances.js");

  test("names all ten elements", () => {
    const markdown = read("elemental_resistances.md");
    ELEMENTAL_TYPES.forEach((type) =>
      expect(markdown).toContain(ELEMENTAL_RESISTANCES[type]),
    );
  });
});
