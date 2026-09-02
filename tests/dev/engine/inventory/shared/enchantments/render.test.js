import {
  enchantmentsExpander,
  enchantmentsEquippedDetail,
  enchantmentsDetailRow,
} from "dev/public/js/engine/inventory/shared/enchantments/render.js";
import {
  setEnchantmentAddFormSelection,
  setEnchantmentAddFormTypeFilter,
  setEnchantmentAddFormTargetFilter,
} from "dev/public/js/engine/inventory/shared/enchantments/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function parse(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

function seedCatalog() {
  state.data.enchantmentEffectTypes = {
    ATTRIBUTE_EFFECT_TYPES: ["attribute", "weaken_attribute"],
    POINT_EFFECT_TYPES: [],
    SKILL_EFFECT_TYPES: ["skill", "fortify_skill"],
    SPELL_EFFECT_TYPES: ["spell"],
    WEIGHT_EFFECT_TYPES: ["add_weight"],
    DAMAGE_RESISTANCE_EFFECT_TYPES: ["fortify_damage_resistance"],
    ELEMENTAL_RESISTANCE_EFFECT_TYPES: ["fortify_resistance"],
    VALUE_EFFECT_TYPES: [
      "attribute",
      "weaken_attribute",
      "add_weight",
      "fortify_damage_resistance",
      "fortify_resistance",
    ],
    FORTIFY_EFFECT_TYPES: ["fortify_skill", "add_weight"],
    WEAKEN_EFFECT_TYPES: ["weaken_attribute"],
  };
  state.data.enchantments = [
    {
      enchantment_id: "ENCH-ATTR",
      enchantment_name: "Força Aprimorada",
      enchantment_effect_type: "attribute",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Físico",
      enchantment_base_value: 2,
      enchantment_step: 1,
      enchantment_description: "Aumenta um atributo.",
    },
    {
      enchantment_id: "ENCH-ATTR-WEAKEN",
      enchantment_name: "Fraqueza",
      enchantment_effect_type: "weaken_attribute",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Físico",
      enchantment_base_value: 2,
      enchantment_step: 1,
    },
    {
      enchantment_id: "ENCH-ADV",
      enchantment_name: "Concede Vantagem",
      enchantment_effect_type: "advantage",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Social",
    },
    {
      enchantment_id: "ENCH-DIS",
      enchantment_name: "Impõe Desvantagem",
      enchantment_effect_type: "disadvantage",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Social",
    },
    {
      enchantment_id: "ENCH-SKILL",
      enchantment_name: "Concede Perícia",
      enchantment_effect_type: "skill",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Perícia",
    },
    {
      enchantment_id: "ENCH-FORTIFY-SKILL",
      enchantment_name: "Fortifica Perícia",
      enchantment_effect_type: "fortify_skill",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Perícia",
    },
    {
      enchantment_id: "ENCH-SPELL",
      enchantment_name: "Concede Feitiço",
      enchantment_effect_type: "spell",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Magia",
    },
    {
      enchantment_id: "ENCH-WEIGHT",
      enchantment_name: "Aumentar Peso",
      enchantment_effect_type: "add_weight",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Peso",
      enchantment_base_value: 0.1,
      enchantment_step: 0.1,
      enenchantment_is_percentage: "TRUE",
    },
    {
      enchantment_id: "ENCH-DR",
      enchantment_name: "Aumentar Resistência à Dano",
      enchantment_effect_type: "fortify_damage_resistance",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Resistência a Dano",
      enchantment_base_value: 1,
      enchantment_step: 1,
      enenchantment_is_percentage: "FALSE",
    },
    {
      enchantment_id: "ENCH-RESIST-FIRE",
      enchantment_name: "Fortificar Resistência à Fogo",
      enchantment_effect_type: "fortify_resistance",
      enchantment_target: "Fire",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Resistência Elemental",
      enchantment_base_value: 0.05,
      enchantment_step: 0.05,
      enenchantment_is_percentage: "TRUE",
    },
  ];
  state.data.advantages = [
    {
      advantage_id: "ADV-001",
      advantage_name: "Visão Noturna",
      advantage_type: "Físico",
      advantage_box_name: "VISÃO NOTURNA | 10",
    },
    {
      advantage_id: "ADV-RACIAL",
      advantage_name: "Traço Racial X",
      advantage_type: "Racial",
      advantage_box_name: "RACIAL X",
    },
  ];
  state.data.disadvantages = [
    {
      disadvantage_id: "DIS-001",
      disadvantage_name: "Sono Leve",
      disadvantage_type: "Físico",
      disadvantage_box_name: "SONO LEVE | -5",
    },
  ];
  state.data.skills = [
    {
      skill_id: "SK-001",
      skill_name: "Espada",
      skill_category: "Combate",
      skill_box_name: "ESPADA (Combate) | IQ",
    },
  ];
  state.data.spells = [
    {
      spell_name: "Bola de Fogo",
      spell_school: "Fogo",
      spell_box_name: "BOLA DE FOGO (Fogo)",
      tier: 1,
    },
    {
      spell_name: "Bola de Fogo",
      spell_school: "Fogo",
      spell_box_name: "BOLA DE FOGO (Fogo)",
      tier: 2,
    },
  ];
}

beforeEach(() => {
  resetState();
  seedCatalog();
});

// ─────────────────────────────────────────────────────────────────────────
// enchantmentsExpander — structure and empty state
// ─────────────────────────────────────────────────────────────────────────
describe("enchantmentsExpander — structure", () => {
  test("renders a <details data-detail-kind='enchantments'> with the title", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const details = el.querySelector("details");
    expect(details.dataset.detailKind).toBe("enchantments");
    expect(
      details.querySelector(".enchantments-summary span").textContent,
    ).toBe(t("enchantments.title"));
  });

  test("shows the empty-state message when there are no entries", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".custom-fields-empty").textContent).toBe(
      t("enchantments.noneAttached"),
    );
  });

  test("shows no subtotal span when there are no entries", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantments-subtotal")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// enchantmentsExpander — subtotal computation
// ─────────────────────────────────────────────────────────────────────────
describe("enchantmentsExpander — subtotal", () => {
  const entries = [
    { _instanceId: "E1", enchantment_id: "ENCH-ADV", target: "ADV-001" },
    { _instanceId: "E2", enchantment_id: "ENCH-DIS", target: "DIS-001" },
  ];

  test("sums resolved prices across every entry", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries,
        itemCategory: "Cabeça",
        resolvedEntries: [
          { _instanceId: "E1", price: 10 },
          { _instanceId: "E2", price: 5 },
        ],
      }),
    );
    expect(el.querySelector(".enchantments-subtotal").textContent).toContain(
      "15",
    );
  });

  test("counts a partially-resolved set (one entry still unresolved) toward the total, not as fully unresolved", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries,
        itemCategory: "Cabeça",
        resolvedEntries: [{ _instanceId: "E1", price: 10 }], // E2 unresolved
      }),
    );
    expect(el.querySelector(".enchantments-subtotal").textContent).toContain(
      "10",
    );
  });

  test("shows no subtotal at all when NO entry has a resolved price yet", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries,
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantments-subtotal")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// enchantmentsExpander — entry list rendering
// ─────────────────────────────────────────────────────────────────────────
describe("enchantmentsExpander — entry list", () => {
  test("renders an advantage entry's target name and price", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-ADV", target: "ADV-001" },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [{ _instanceId: "E1", price: 10 }],
      }),
    );
    const summary = el.querySelector(".enchantment-entry-summary");
    expect(summary.querySelector(".enchantment-entry-label").textContent).toBe(
      "Concede Vantagem: Visão Noturna",
    );
    expect(summary.querySelector(".enchantment-entry-price").textContent).toBe(
      "10",
    );
  });

  test("shows '—' for an entry's price when unresolved", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-ADV", target: "ADV-001" },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-price").textContent).toBe("—");
  });

  test("renders an attribute entry's signed magnitude, no target", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [{ _instanceId: "E1", enchantment_id: "ENCH-ATTR", value: 3 }],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Força Aprimorada: +3",
    );
  });

  test("renders a percentage-flagged entry's magnitude as a signed percent, converted from the stored decimal", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-WEIGHT", value: 0.2 },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Aumentar Peso: +20%",
    );
  });

  test("renders a non-percentage value entry's magnitude with no % suffix", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [{ _instanceId: "E1", enchantment_id: "ENCH-DR", value: 2 }],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Aumentar Resistência à Dano: +2",
    );
  });

  test("renders a fixed-target elemental-resistance entry's localized element name, read from the record (not the entry)", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          {
            _instanceId: "E1",
            enchantment_id: "ENCH-RESIST-FIRE",
            value: 0.05,
          },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Fortificar Resistência à Fogo: Fogo: +5%",
    );
  });

  test("renders a skill entry's target name and extraPoints magnitude", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          {
            _instanceId: "E1",
            enchantment_id: "ENCH-SKILL",
            target: "SK-001",
            extraPoints: 2,
          },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Concede Perícia: Espada: +2",
    );
  });

  test("silently omits an entry whose enchantment_id no longer resolves to a catalog record", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [{ _instanceId: "E1", enchantment_id: "GHOST" }],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelectorAll(".enchantment-entry")).toHaveLength(0);
  });

  test("falls back to the raw id when a target's name can't be resolved", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-ADV", target: "GHOST-ID" },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-entry-label").textContent).toBe(
      "Concede Vantagem: GHOST-ID",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Wrapper variants
// ─────────────────────────────────────────────────────────────────────────
describe("enchantmentsEquippedDetail / enchantmentsDetailRow", () => {
  const params = {
    instanceId: "ITEM-1",
    entries: [],
    itemCategory: "Cabeça",
    resolvedEntries: [],
  };

  test("enchantmentsEquippedDetail wraps the expander in a .equipped-detail div", () => {
    const el = parse(enchantmentsEquippedDetail(params));
    const wrapper = el.querySelector(".equipped-detail");
    expect(wrapper).not.toBeNull();
    expect(
      wrapper.querySelector("details[data-detail-kind='enchantments']"),
    ).not.toBeNull();
  });

  test("enchantmentsDetailRow wraps the expander in a detail-row <tr><td colspan>", () => {
    const el = parse(
      `<table><tbody>${enchantmentsDetailRow(4, params)}</tbody></table>`,
    );
    const row = el.querySelector("tr.detail-row");
    expect(row).not.toBeNull();
    expect(row.querySelector("td").getAttribute("colspan")).toBe("4");
    expect(
      row.querySelector("details[data-detail-kind='enchantments']"),
    ).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Add-form specifics
// ─────────────────────────────────────────────────────────────────────────
describe("add-form", () => {
  test("category filter is present when the category offers more than one enchantment_type", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-category-filter")).not.toBeNull();
  });

  test("category filter is omitted when the category has only one enchantment_type", () => {
    state.data.enchantments = state.data.enchantments.filter(
      (e) =>
        e.enchantment_allowed_itens === "Cabeça" &&
        e.enchantment_type === "Físico",
    );
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-category-filter")).toBeNull();
  });

  test("groups type options into <optgroup>s when more than one type is present", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(
      el.querySelectorAll(".enchantment-type-select optgroup").length,
    ).toBeGreaterThan(1);
  });

  test("uses a flat option list (no optgroups) when the category has only one type", () => {
    setEnchantmentAddFormTypeFilter("ITEM-1", "Físico");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(
      el.querySelectorAll(".enchantment-type-select optgroup"),
    ).toHaveLength(0);
  });

  test("shows the empty-state guard message among the add-form's markup when nothing is allowed for the category", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Tronco", // nothing seeded allows Tronco
        resolvedEntries: [],
      }),
    );
    // Two ".custom-fields-empty" messages can legitimately coexist: the
    // entries-list's "nothing attached yet" (since entries=[] here too) and
    // the add-form's "nothing available" guard — so check among all of
    // them rather than assuming the guard is the only/first match.
    const messages = Array.from(
      el.querySelectorAll(".custom-fields-empty"),
    ).map((p) => p.textContent);
    expect(messages).toContain(t("enchantments.noneAvailable"));
    expect(el.querySelector(".enchantment-add-btn")).toBeNull();
  });

  test("the add button carries the item's instanceId", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-add-btn").dataset.instanceId).toBe(
      "ITEM-1",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Edit-form specifics
// ─────────────────────────────────────────────────────────────────────────
describe("edit-form", () => {
  const entry = {
    _instanceId: "ENTRY-1",
    enchantment_id: "ENCH-ATTR",
    value: 5,
  };

  test("save/remove buttons carry both the parent and entry instance ids", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [entry],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const save = el.querySelector(".enchantment-save-btn");
    const remove = el.querySelector(".enchantment-remove-btn");
    expect(save.dataset.instanceId).toBe("ITEM-1");
    expect(save.dataset.entryInstanceId).toBe("ENTRY-1");
    expect(remove.dataset.instanceId).toBe("ITEM-1");
    expect(remove.dataset.entryInstanceId).toBe("ENTRY-1");
  });

  test("pre-fills the entry's current value when it hasn't been swapped to a different type", () => {
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [entry],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(
      ".enchantment-entry-edit .enchantment-value-input",
    );
    expect(input.getAttribute("value")).toBe("5");
  });

  test("falls back to fresh type defaults (not the entry's old value) once swapped to a different enchantment", () => {
    setEnchantmentAddFormSelection("ENTRY-1", "ENCH-ATTR-WEAKEN");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [entry],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(
      ".enchantment-entry-edit .enchantment-value-input",
    );
    // ENCH-ATTR-WEAKEN's default is -base_value (-2), NOT the old entry's 5
    expect(input.getAttribute("value")).toBe("-2");
  });

  test("each entry's form is scoped by its own _instanceId as formKey, independent of other entries", () => {
    const secondEntry = {
      _instanceId: "ENTRY-2",
      enchantment_id: "ENCH-ATTR",
      value: 9,
    };
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [entry, secondEntry],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const forms = el.querySelectorAll(".enchantment-form");
    // The entries list renders BEFORE the add-form in the source
    // (enchantmentsBody: `${list}${renderAddForm(...)}`), so entry forms
    // come first, then the add-form last.
    expect(Array.from(forms).map((f) => f.dataset.formKey)).toEqual([
      "ENTRY-1",
      "ENTRY-2",
      "ITEM-1",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Sign-aware number inputs
// ─────────────────────────────────────────────────────────────────────────
describe("valueInput bounds", () => {
  test("a non-weaken attribute type gets a data-min bound at its base value", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-ATTR");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-value-input");
    expect(input.dataset.min).toBe("2");
    expect(input.dataset.max).toBeUndefined();
    expect(input.getAttribute("value")).toBe("2"); // default = +base
  });

  test("a weaken attribute type gets a data-max bound at the negative base value", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-ATTR-WEAKEN");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-value-input");
    expect(input.dataset.max).toBe("-2");
    expect(input.getAttribute("value")).toBe("-2"); // default = -base
  });

  test("shows the plain 'Valor' label for a non-percentage value type", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-ATTR");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const label = el.querySelector(".enchantment-value-input").closest("label");
    expect(label.querySelector("em").textContent).toBe(t("enchantments.value"));
  });

  test("a percentage-flagged type displays/steps the input in whole percent units, not the raw decimal", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-WEIGHT");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-value-input");
    // base_value 0.1 -> displayed as 10 (percent), step 0.1 -> 10
    expect(input.getAttribute("value")).toBe("10");
    expect(input.dataset.min).toBe("10");
    expect(input.dataset.step).toBe("10");
  });

  test("a percentage-flagged type shows the '(%)' label instead of the plain one", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-WEIGHT");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const label = el.querySelector(".enchantment-value-input").closest("label");
    expect(label.querySelector("em").textContent).toBe(
      t("enchantments.valuePercent"),
    );
  });

  test("a percentage-flagged type pre-fills the entry's current decimal value converted to percent", () => {
    const entry = {
      _instanceId: "ENTRY-PCT-1",
      enchantment_id: "ENCH-WEIGHT",
      value: 0.3,
    };
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [entry],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(
      ".enchantment-entry-edit .enchantment-value-input",
    );
    expect(input.getAttribute("value")).toBe("30");
  });

  test("a non-percentage damage-resistance type displays the whole number as-is", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-DR");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-value-input");
    expect(input.getAttribute("value")).toBe("1");
    expect(input.dataset.min).toBe("1");
  });

  test("a fixed-target elemental-resistance type renders a value input but no target picker", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-RESIST-FIRE");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector(".enchantment-value-input")).not.toBeNull();
    expect(el.querySelector(".enchantment-target-select")).toBeNull();
  });
});

describe("extraPointsInput bounds", () => {
  test("a fortify type defaults to +1 with a data-min of 1", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-FORTIFY-SKILL");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-extra-points-input");
    expect(input.dataset.min).toBe("1");
    expect(input.getAttribute("value")).toBe("1");
  });

  test("a plain skill type (neither fortify nor weaken) defaults to 0 with a data-min of 0", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-SKILL");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const input = el.querySelector(".enchantment-extra-points-input");
    expect(input.dataset.min).toBe("0");
    expect(input.getAttribute("value")).toBe("0");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Target picker
// ─────────────────────────────────────────────────────────────────────────
describe("target picker", () => {
  test("excludes racial-type traits from the advantage target list", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-ADV");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const targetOptions = Array.from(
      el.querySelectorAll(".enchantment-target-select option"),
    ).map((o) => o.value);
    expect(targetOptions).toEqual(["ADV-001"]);
    expect(targetOptions).not.toContain("ADV-RACIAL");
  });

  test("a filter selection narrows the target list to matching rows", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-SKILL");
    setEnchantmentAddFormTargetFilter("ITEM-1", "Combate");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const targetOptions = Array.from(
      el.querySelectorAll(".enchantment-target-select option"),
    ).map((o) => o.value);
    expect(targetOptions).toEqual(["SK-001"]);
  });

  test("the spell target picker is deduplicated by spell name (one option per name, not per tier row)", () => {
    setEnchantmentAddFormSelection("ITEM-1", "ENCH-SPELL");
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    const targetOptions = el.querySelectorAll(
      ".enchantment-target-select option",
    );
    expect(targetOptions).toHaveLength(1);
    expect(targetOptions[0].value).toBe("Bola de Fogo");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// HTML escaping
// ─────────────────────────────────────────────────────────────────────────
describe("HTML escaping", () => {
  test("escapes a target label's special characters", () => {
    state.data.advantages.push({
      advantage_id: "ADV-XSS",
      advantage_name: "<b>bold</b>",
      advantage_type: "Físico",
      advantage_box_name: "X",
    });
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-ADV", target: "ADV-XSS" },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    expect(el.querySelector("b")).toBeNull();
    expect(el.querySelector(".enchantment-entry-label").textContent).toContain(
      "<b>bold</b>",
    );
  });

  // NOTE: unlike the target label (escaped above) and every other dynamic
  // string in this file (recordDescriptionMarkup, filter/type option
  // labels, etc.), the enchantment's own NAME is pushed into the entry
  // summary unescaped: `const parts = [record.enchantment_name];` has no
  // escapeHtml() wrapper, while the very next line does wrap targetLabel.
  // In practice enchantment_name comes from admin-authored CSV data, not
  // end-user input, so this isn't an active injection risk today — but
  // it's a real inconsistency with the escaping discipline used everywhere
  // else in this file. Flagged to r4ven rather than "fixed" here. This test
  // locks in the CURRENT (unescaped) behavior so a future fix is a visible,
  // intentional test change rather than a silent one.
  test("[KNOWN GAP] enchantment_name itself is NOT escaped in the entry summary", () => {
    state.data.enchantments.push({
      enchantment_id: "ENCH-XSS",
      enchantment_name: "<i>italic</i>",
      enchantment_effect_type: "advantage",
      enchantment_allowed_itens: "Cabeça",
      enchantment_type: "Social",
    });
    const el = parse(
      enchantmentsExpander({
        instanceId: "ITEM-1",
        entries: [
          { _instanceId: "E1", enchantment_id: "ENCH-XSS", target: "ADV-001" },
        ],
        itemCategory: "Cabeça",
        resolvedEntries: [],
      }),
    );
    // Documents the gap: a real <i> element gets created, proving the
    // string was NOT escaped before being embedded.
    expect(el.querySelector("i")?.textContent).toBe("italic");
  });
});
