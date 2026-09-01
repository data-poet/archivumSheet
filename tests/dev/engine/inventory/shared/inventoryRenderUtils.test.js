import {
  hpModifierBlock,
  resolveHp,
  statModifierBlock,
} from "dev/public/js/engine/inventory/shared/inventoryRenderUtils.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";

function parseBlock(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("hpModifierBlock", () => {
  test("computes and displays maxHp and actualHp using the real material/HP math", () => {
    const block = parseBlock(
      hpModifierBlock({
        baseHp: 10,
        material: { material_hit_points_modifier: 2 },
        hpModifier: -5,
        cssClass: "hp-mod-input",
      }),
    );
    const strongs = block.querySelectorAll("strong");
    expect(strongs[0].textContent).toBe("20"); // maxHp = 10 * 2
    expect(strongs[1].textContent).toBe("15"); // actualHp = 20 - 5
  });

  test("applies the given css class and data attributes to the input", () => {
    const block = parseBlock(
      hpModifierBlock({
        baseHp: 10,
        material: null,
        hpModifier: 0,
        cssClass: "hp-mod-input",
        dataAttrs: 'data-instance-id="INST-1"',
      }),
    );
    const input = block.querySelector("input");
    expect(input.className).toBe("hp-mod-input");
    expect(input.dataset.instanceId).toBe("INST-1");
  });

  test("defaults the input's value to 0 when hpModifier is falsy", () => {
    const block = parseBlock(
      hpModifierBlock({
        baseHp: 10,
        material: null,
        hpModifier: null,
        cssClass: "hp-mod-input",
      }),
    );
    expect(block.querySelector("input").getAttribute("value")).toBe("0");
  });

  test("uses the localized 'mod'/'hp'/'actual' labels", () => {
    const html = hpModifierBlock({
      baseHp: 10,
      material: null,
      hpModifier: 0,
      cssClass: "hp-mod-input",
    });
    expect(html).toContain(t("common.mod"));
    expect(html).toContain(t("common.hp"));
    expect(html).toContain(t("common.actual"));
  });
});

describe("resolveHp", () => {
  const materials = [
    { material_id: "MAT-001", material_hit_points_modifier: 2 },
  ];

  test("resolves material, maxHp, and actualHp together for an instance", () => {
    const instance = { material_id: "MAT-001", hit_points_modifier: -3 };
    const result = resolveHp(instance, 10, materials);
    expect(result.material).toBe(materials[0]);
    expect(result.maxHp).toBe(20);
    expect(result.actualHp).toBe(17);
  });

  test("falls back to no material and a 1x modifier when material_id is unset", () => {
    const result = resolveHp({}, 10, materials);
    expect(result.material).toBeNull();
    expect(result.maxHp).toBe(10);
    expect(result.actualHp).toBe(10);
  });
});

describe("statModifierBlock", () => {
  test("computes actual as baseValue + modifier", () => {
    const block = parseBlock(
      statModifierBlock({
        label: "TR",
        baseValue: 5,
        modifier: 2,
        cssClass: "stat-mod-input",
      }),
    );
    expect(block.querySelector("strong").textContent).toBe("7");
  });

  test("coerces non-numeric baseValue/modifier to 0", () => {
    const block = parseBlock(
      statModifierBlock({
        label: "TR",
        baseValue: "abc",
        modifier: "xyz",
        cssClass: "stat-mod-input",
      }),
    );
    expect(block.querySelector("strong").textContent).toBe("0");
  });

  test("defaults the input's value to 0 when modifier is falsy, and shows the label", () => {
    const html = statModifierBlock({
      label: "PREC",
      baseValue: 3,
      modifier: null,
      cssClass: "stat-mod-input",
    });
    const block = parseBlock(html);
    expect(block.querySelector("input").getAttribute("value")).toBe("0");
    expect(html).toContain("PREC");
  });
});
