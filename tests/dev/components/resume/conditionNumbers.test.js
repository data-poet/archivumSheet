import { renderResume } from "dev/public/js/components/resume/index.js";
import { nhCell } from "dev/public/js/components/resume/shared.js";
import { conditionCell } from "dev/public/js/shared/conditionDisplay.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";
import { RANGED, SHIELD, SKILL } from "tests/helpers/dataRefs";
import { buildSheet } from "engine/buildSheet";

const id = (x) => document.getElementById(x);
const modified = (containerId) =>
  [...id(containerId).querySelectorAll(".condition-modified")].map((node) => ({
    text: node.textContent.replace(/\s+/g, " ").trim(),
    title: node.title,
  }));

beforeEach(() => {
  resetResumeDOM();
});

describe("conditionCell", () => {
  test("a plain number when no effective value was attached", () => {
    expect(conditionCell({ value: 12 }, "value")).toBe("12");
    expect(conditionCell({ parry: 0 }, "parry")).toBe("0");
  });

  test("a missing number is a dash", () => {
    expect(conditionCell({}, "parry")).toBe("—");
    expect(conditionCell({ parry: null }, "parry")).toBe("—");
    expect(conditionCell(undefined, "value")).toBe("—");
  });

  test("shows the effective number with the base beside it and the total in the tooltip", () => {
    const html = conditionCell({ value: 12, effective_value: 8 }, "value");
    document.body.innerHTML = html;

    const node = document.querySelector(".condition-modified");
    expect(node.textContent.replace(/\s+/g, " ").trim()).toBe("8 (12)");
    expect(node.title).toBe("Condições −4 (base 12)");
    expect(node.querySelector(".condition-base").textContent).toBe("(12)");
  });

  test("a bonus is signed with a plus", () => {
    document.body.innerHTML = conditionCell(
      { value: 10, effective_value: 12 },
      "value",
    );

    expect(document.querySelector(".condition-modified").title).toBe(
      "Condições +2 (base 10)",
    );
  });
});

describe("nhCell", () => {
  test("is unchanged without an effective level", () => {
    expect(nhCell({ level: 12 })).toBe("12");
  });

  test("shows the effective level with the base beside it", () => {
    document.body.innerHTML = nhCell({ level: 12, effective_level: 9 });

    const node = document.querySelector(".condition-modified");
    expect(node.textContent.replace(/\s+/g, " ").trim()).toBe("9 (12)");
    expect(node.title).toBe("Condições −3 (base 12)");
  });

  test("keeps the default-level asterisk and its note on the base number", () => {
    document.body.innerHTML = nhCell(
      {
        level: 10,
        effective_level: 6,
        source: { type: "attribute", attribute: "DX", penalty: -5 },
      },
      {},
    );

    const star = document.querySelector(".condition-base .resume-nh-default");
    expect(star.textContent).toBe("10*");
    expect(star.title).toContain("padrão: DX -5");
  });
});

describe("resume sections", () => {
  const check = (level, effective, parry, effectiveParry) => ({
    level,
    ...(effective != null ? { effective_level: effective } : {}),
    parry,
    ...(effectiveParry != null ? { effective_parry: effectiveParry } : {}),
    actions: 1,
    critical: { success: 4, failure: 17 },
  });

  test("the primary attribute boxes show the modified ones only", () => {
    renderResume({
      character: {
        primary_attributes: {
          ST: { value: 10 },
          DX: { value: 12, effective_value: 8, condition_modifier: -4 },
          IQ: { value: 11 },
          HT: { value: 10 },
        },
      },
    });

    expect(modified("resume_primary_attrs")).toEqual([
      { text: "8 (12)", title: "Condições −4 (base 12)" },
    ]);
    expect(id("resume_primary_attrs").textContent).toContain("10");
  });

  test("the secondary snapshot shows Dodge and Will modified, and leaves Basic Speed alone", () => {
    renderResume({
      character: {
        secondary_attributes: {
          Will: { value: 11, effective_value: 9 },
          BasicSpeed: { value: 5 },
          Dodge: { value: 8, effective_value: 4 },
        },
      },
    });

    expect(modified("resume_secondary_snapshot").map((m) => m.text)).toEqual([
      "9 (11)",
      "4 (8)",
    ]);
    expect(id("resume_secondary_snapshot").textContent).toContain("5.00");
  });

  test("skills show the level and the Parry modified independently", () => {
    renderResume({
      character: {
        skills: {
          a: {
            name: "Bastão",
            value: 14,
            effective_value: 11,
            parry: 12,
            effective_parry: 8,
            critical: { success: 4, failure: 17 },
            actions: 1,
          },
          b: {
            name: "Furtividade",
            value: 12,
            parry: null,
            critical: { success: 4, failure: 17 },
            actions: 1,
          },
        },
      },
    });

    expect(modified("resume_skills_container").map((m) => m.text)).toEqual([
      "11 (14)",
      "8 (12)",
    ]);
  });

  test("spells show the casting level modified", () => {
    renderResume(
      {
        grimoire: {
          s1: {
            name: "Bola de Fogo",
            value: 14,
            effective_value: 10,
            critical: { success: 4, failure: 17 },
          },
        },
      },
      { spells: [] },
    );

    expect(modified("resume_magic_container").map((m) => m.text)).toEqual([
      "10 (14)",
    ]);
  });

  test("the melee table shows Desarmado and weapon NH and Parry modified", () => {
    renderResume({
      character: {
        unarmed: [
          {
            name: null,
            level: 12,
            effective_level: 8,
            parry: 9,
            effective_parry: 5,
            actions: 1,
            critical: { success: 4, failure: 17 },
          },
        ],
      },
      inventory: {
        melee: {
          equipped: [
            {
              id: "m1",
              weapon_name: "Espada",
              weapon_final_hit_points: 18,
              skill_check: check(14, 10, 10, 6),
            },
          ],
        },
      },
    });

    expect(modified("resume_melee_container").map((m) => m.text)).toEqual([
      "8 (12)",
      "5 (9)",
      "10 (14)",
      "6 (10)",
    ]);
  });

  test("the ranged table shows the attack level modified", () => {
    renderResume({
      inventory: {
        ranged: {
          equipped: [
            {
              id: "r1",
              weapon_name: "Arco",
              weapon_final_hit_points: 10,
              skill_check: check(13, 9, null, null),
            },
          ],
        },
      },
    });

    expect(modified("resume_ranged_container").map((m) => m.text)).toEqual([
      "9 (13)",
    ]);
  });

  test("the firearms table shows the attack level modified", () => {
    renderResume({
      inventory: {
        firearms: {
          equipped: [
            {
              id: "f1",
              weapon_name: "Pistola",
              weapon_final_hit_points: 10,
              weapon_final_magazine_size: 8,
              skill_check: check(12, 9, null, null),
            },
          ],
        },
      },
    });

    expect(modified("resume_firearms_container").map((m) => m.text)).toEqual([
      "9 (12)",
    ]);
  });

  test("the shield shows Block and its attack level modified", () => {
    renderResume({
      inventory: {
        shield: {
          equipped: {
            shield_name: "Escudo",
            block: 9,
            effective_block: 5,
            skill_check: check(12, 8, null, null),
          },
        },
      },
    });

    expect(modified("resume_shield_container").map((m) => m.text)).toEqual([
      "8 (12)",
      "5 (9)",
    ]);
  });

  test("a sheet with no condition fields renders no modified number anywhere", () => {
    renderResume({
      character: {
        primary_attributes: { DX: { value: 12 } },
        secondary_attributes: { Dodge: { value: 8 } },
        skills: {
          a: { name: "X", value: 10, parry: 8, critical: null, actions: 1 },
        },
        unarmed: [{ level: 12, parry: 9, actions: 1 }],
      },
      inventory: { shield: { equipped: { shield_name: "E", block: 9 } } },
    });

    expect(document.querySelectorAll(".condition-modified")).toHaveLength(0);
  });
});

describe("with the sheet the real engine builds", () => {
  const sheet = buildSheet({
    character: {
      primaryAttributes: { ST: {}, DX: {}, IQ: {}, HT: {} },
      skills: [{ skill_id: SKILL.bastao, base_value: 14, modifier: 0 }],
      conditions: ["dor-grave", "atordoamento-fisico"],
    },
    inventory: {
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
  });

  beforeEach(() => {
    renderResume(sheet, {}, {});
  });

  test("DX, Dodge and the Desarmado row show the penalties the engine computed", () => {
    const { DX } = sheet.character.primary_attributes;
    const { Dodge } = sheet.character.secondary_attributes;
    const [unarmed] = sheet.character.unarmed;

    expect(modified("resume_primary_attrs")[0].text).toBe(
      `${DX.effective_value} (${DX.value})`,
    );
    expect(modified("resume_secondary_snapshot").map((m) => m.text)).toContain(
      `${Dodge.effective_value} (${Dodge.value})`,
    );
    // Desarmado rolls off DX by default, which nhCell marks with an asterisk on the base level.
    expect(unarmed.source.type).toBe("attribute");
    expect(modified("resume_melee_container").map((m) => m.text)).toEqual([
      `${unarmed.effective_level} (${unarmed.level}*)`,
      `${unarmed.effective_parry} (${unarmed.parry})`,
    ]);
  });

  test("the shield shows both its attack level and its Block modified", () => {
    const shield = sheet.inventory.shield.equipped;

    expect(shield.skill_check.source.type).not.toBe("learned");
    expect(modified("resume_shield_container").map((m) => m.text)).toEqual([
      `${shield.skill_check.effective_level} (${shield.skill_check.level}*)`,
      `${shield.effective_block} (${shield.block})`,
    ]);
  });
});
