import { renderResumeConditions } from "dev/public/js/components/resume/conditions.js";
import { renderResume } from "dev/public/js/components/resume/index.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";
import { ADVANTAGE } from "tests/helpers/dataRefs";
import { buildSheet } from "engine/buildSheet";
import { loadDataset } from "helpers/datasets.js";
import rules from "helpers/rules.js";

const id = (x) => document.getElementById(x);
const container = () => id("resume_conditions_container");

const row = (key, name, group, overrides = {}) => ({
  condition_key: key,
  condition_name: name,
  condition_group: group,
  condition_exclusive_group: "",
  condition_reminders: "",
  ...overrides,
});

const CATALOG = [
  row("atordoamento-fisico", "Atordoamento Físico", "Atordoamento"),
  row("atordoamento-mental", "Atordoamento Mental", "Atordoamento"),
  row("tosse-ou-espirro", "Tosse ou Espirro", "Irritante", {
    condition_reminders: "Não pode usar a perícia Furtividade.",
  }),
  row("dor-grave", "Dor Grave", "Irritante", {
    condition_exclusive_group: "dor",
  }),
  row("sufocamento", "Sufocamento", "Incapacitante"),
];

function sheetWith(conditions, immunities) {
  return {
    character: {
      ...(conditions ? { conditions } : {}),
      ...(immunities ? { condition_immunities: immunities } : {}),
    },
  };
}

const resolved = (overrides = {}) => ({
  active: [],
  immune: [],
  dropped: [],
  tags: [],
  modifiers: {},
  recoveries: [],
  reminders: [],
  ...overrides,
});

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeConditions without a catalog", () => {
  test("hides the card until the conditions are loaded", () => {
    renderResumeConditions({}, { conditions: [] }, {});

    expect(container().hidden).toBe(true);
    expect(container().innerHTML).toBe("");
  });

  test("is wired into renderResume and gets the catalog and the flags", () => {
    renderResume({}, { conditions: CATALOG }, { conditions: { coma: true } });

    expect(container().hidden).toBe(false);
    expect(container().querySelector(".conditions-list")).not.toBeNull();
  });

  test("survives a missing container", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    container().remove();

    expect(() =>
      renderResumeConditions({}, { conditions: CATALOG }, {}),
    ).not.toThrow();
    warn.mockRestore();
  });
});

describe("active conditions", () => {
  const entryKeys = () =>
    [...container().querySelectorAll(".condition-remove")].map(
      (button) => button.dataset.conditionKey,
    );
  const entryOf = (key) =>
    container()
      .querySelector(`.condition-remove[data-condition-key="${key}"]`)
      .closest(".condition-entry");

  test("with nothing on, says so and shows no entries or summary", () => {
    renderResumeConditions(sheetWith(), { conditions: CATALOG }, {});

    expect(container().querySelector(".conditions-none").textContent).toBe(
      t("conditions.noneActive"),
    );
    expect(container().querySelector(".conditions-active")).toBeNull();
    expect(container().querySelector(".conditions-summary")).toBeNull();
  });

  test("shows one entry per condition the engine applied, in catalog order, and the summary line", () => {
    renderResumeConditions(
      sheetWith(
        resolved({
          active: [
            { key: "tosse-ou-espirro", name: "Tosse ou Espirro" },
            { key: "atordoamento-fisico", name: "Atordoamento Físico" },
          ],
          tags: ["stunned"],
          modifiers: { DX: -3, IQ: -1, defense: -4 },
        }),
      ),
      { conditions: CATALOG },
      { conditions: { "tosse-ou-espirro": true, "atordoamento-fisico": true } },
    );

    expect(entryKeys()).toEqual(["atordoamento-fisico", "tosse-ou-espirro"]);
    expect(container().querySelector(".conditions-summary").textContent).toBe(
      "DX −3 · IQ −1 · Defesas −4 · Atordoado",
    );
  });

  test("a flag the engine dropped (unknown or excluded) shows no entry", () => {
    renderResumeConditions(
      sheetWith(
        resolved({
          active: [],
          dropped: [{ key: "dor-grave", reason: "exclusive" }],
        }),
      ),
      { conditions: CATALOG },
      { conditions: { "dor-grave": true } },
    );

    expect(container().querySelector(".condition-entry")).toBeNull();
  });

  test("writes each name once, with the recovery roll and the reminder as sub-lines under it", () => {
    renderResumeConditions(
      sheetWith(
        resolved({
          active: [
            { key: "atordoamento-mental", name: "Atordoamento Mental" },
            { key: "tosse-ou-espirro", name: "Tosse ou Espirro" },
          ],
          recoveries: [
            {
              key: "atordoamento-mental",
              attributes: ["Will", "IQ"],
              interval: "turn",
            },
          ],
          reminders: [
            {
              key: "tosse-ou-espirro",
              text: "Não pode usar a perícia Furtividade.",
            },
          ],
        }),
      ),
      { conditions: CATALOG },
      { conditions: { "atordoamento-mental": true, "tosse-ou-espirro": true } },
    );

    const subLines = (key) =>
      [...entryOf(key).querySelectorAll(".condition-entry-notes li")].map(
        (li) => li.textContent,
      );
    expect(subLines("atordoamento-mental")).toEqual([
      "Recuperação: Vontade ou IQ a cada turno",
    ]);
    expect(subLines("tosse-ou-espirro")).toEqual([
      "Não pode usar a perícia Furtividade.",
    ]);

    const text = container().querySelector(".conditions-active").textContent;
    expect(text.match(/Atordoamento Mental/g)).toHaveLength(1);
    expect(text.match(/Tosse ou Espirro/g)).toHaveLength(1);
  });

  test("shows the recovery roll before the reminder when a condition has both", () => {
    renderResumeConditions(
      sheetWith(
        resolved({
          active: [{ key: "atordoamento-fisico", name: "Atordoamento Físico" }],
          recoveries: [
            {
              key: "atordoamento-fisico",
              attributes: ["HT"],
              interval: "turn",
            },
          ],
          reminders: [
            { key: "atordoamento-fisico", text: "Cai e larga o que segura." },
          ],
        }),
      ),
      { conditions: CATALOG },
      { conditions: { "atordoamento-fisico": true } },
    );

    expect(
      [...entryOf("atordoamento-fisico").querySelectorAll("li")].map(
        (li) => li.textContent,
      ),
    ).toEqual(["Recuperação: HT a cada turno", "Cai e larga o que segura."]);
  });

  test("an entry with nothing to add is a bare name line", () => {
    renderResumeConditions(
      sheetWith(
        resolved({ active: [{ key: "dor-grave", name: "Dor Grave" }] }),
      ),
      { conditions: CATALOG },
      { conditions: { "dor-grave": true } },
    );

    expect(
      entryOf("dor-grave").querySelector(".condition-entry-notes"),
    ).toBeNull();
  });

  test("the remove button names the condition it switches off", () => {
    renderResumeConditions(
      sheetWith(
        resolved({ active: [{ key: "dor-grave", name: "Dor Grave" }] }),
      ),
      { conditions: CATALOG },
      { conditions: { "dor-grave": true } },
    );

    const button = container().querySelector(".condition-remove");
    expect(button.textContent).toBe("×");
    expect(button.getAttribute("aria-label")).toBe(
      `${t("conditions.removeTitle")}: Dor Grave`,
    );
  });
});

describe("the recovery roll's target number", () => {
  const withRecovery = (attributes, interval, sheetAttributes = {}) =>
    renderResumeConditions(
      {
        character: {
          ...sheetAttributes,
          conditions: resolved({
            active: [
              { key: "atordoamento-fisico", name: "Atordoamento Físico" },
            ],
            recoveries: [{ key: "atordoamento-fisico", attributes, interval }],
          }),
        },
      },
      { conditions: CATALOG },
      { conditions: { "atordoamento-fisico": true } },
    );
  const note = () =>
    container()
      .querySelector(".condition-entry-notes li")
      .textContent.replace(/\s+/g, " ");

  test("puts the sheet's own HT beside the attribute name", () => {
    withRecovery(["HT"], "turn", {
      primary_attributes: { HT: { value: 12 } },
    });

    expect(note()).toBe("Recuperação: HT 12 a cada turno");
  });

  test("lists each attribute with its own number when the roll can use either", () => {
    withRecovery(["Will", "IQ"], "turn", {
      primary_attributes: { IQ: { value: 10 } },
      secondary_attributes: { Will: { value: 11 } },
    });

    expect(note()).toBe("Recuperação: Vontade 11 ou IQ 10 a cada turno");
  });

  test("shows the effective number with the base beside it when a condition lowers it", () => {
    withRecovery(["HT"], "trigger", {
      primary_attributes: { HT: { value: 12, effective_value: 10 } },
    });

    expect(note()).toBe("Recuperação: HT 10 (12) a cada gatilho");
    expect(
      container().querySelector(".condition-entry-notes .condition-modified")
        .title,
    ).toBe("Condições −2 (base 12)");
  });

  test("falls back to the bare attribute name before the engine has numbers", () => {
    withRecovery(["Will", "IQ"], "turn");

    expect(note()).toBe("Recuperação: Vontade ou IQ a cada turno");
  });

  test("a roll with no number for one of its attributes names it bare", () => {
    withRecovery(["Will", "IQ"], "turn", {
      primary_attributes: { IQ: { value: 10 } },
    });

    expect(note()).toBe("Recuperação: Vontade ou IQ 10 a cada turno");
  });
});

describe("the summary line hides status words another one implies", () => {
  const summaryFor = (tags, data = { conditions: CATALOG, rules }) => {
    renderResumeConditions(
      sheetWith(resolved({ tags, modifiers: { defense: -4 } })),
      data,
      {},
    );
    return container().querySelector(".conditions-summary").textContent;
  };

  test("paralysis reads Incapacitado and Paralisado, not the four it brings", () => {
    expect(
      summaryFor(["cannot_act", "incapacitated", "paralyzed", "stunned"]),
    ).toBe("Defesas −4 · Incapacitado · Paralisado");
  });

  test("unconsciousness reads only Inconsciente", () => {
    expect(
      summaryFor(["cannot_act", "incapacitated", "stunned", "unconscious"]),
    ).toBe("Defesas −4 · Inconsciente");
  });

  test("a stun on its own still reads Atordoado", () => {
    expect(summaryFor(["stunned"])).toBe("Defesas −4 · Atordoado");
  });

  test("shows every tag when the rules have not loaded", () => {
    expect(
      summaryFor(["cannot_act", "incapacitated", "stunned"], {
        conditions: CATALOG,
      }),
    ).toBe("Defesas −4 · Atordoado · Incapacitado · Não pode agir");
  });
});

describe("immunity", () => {
  const sheet = sheetWith(
    resolved({ active: [], immune: [{ key: "sufocamento" }] }),
    [
      {
        key: "sufocamento",
        trait_key: "nao-respira",
        trait_name: "Não Respira",
      },
    ],
  );

  test("a flagged condition the character is immune to shows a dashed entry that can still be removed", () => {
    renderResumeConditions(
      sheet,
      { conditions: CATALOG },
      { conditions: { sufocamento: true } },
    );

    const entry = container().querySelector(".condition-entry--immune");
    const remove = entry.querySelector(".condition-remove");
    expect(remove.dataset.conditionKey).toBe("sufocamento");
    expect(remove.disabled).toBe(false);
    expect(entry.title).toContain("Não Respira");
    expect(entry.textContent).toContain(`(${t("conditions.immune")})`);
    expect(entry.querySelector(".condition-entry-notes")).toBeNull();
  });

  test("its checkbox is disabled, with the trait as the tooltip, even when it is off", () => {
    renderResumeConditions(sheet, { conditions: CATALOG }, {});

    const box = container().querySelector(
      '.condition-toggle[data-condition-key="sufocamento"]',
    );
    expect(box.disabled).toBe(true);
    expect(box.closest("label").title).toContain("Não Respira");
    expect(box.closest("label").classList.contains("is-immune")).toBe(true);
  });
});

describe("the full list", () => {
  test("groups the conditions under their labelled headings, in catalog order", () => {
    renderResumeConditions({}, { conditions: CATALOG }, {});

    const legends = [
      ...container().querySelectorAll(".conditions-group legend"),
    ].map((l) => l.textContent);
    expect(legends).toEqual(["Atordoamento", "Irritantes", "Incapacitantes"]);
  });

  test("checks the boxes of the flags that are on and leaves the rest", () => {
    renderResumeConditions(
      {},
      { conditions: CATALOG },
      { conditions: { "dor-grave": true } },
    );

    const checked = [
      ...container().querySelectorAll(".condition-toggle:checked"),
    ].map((b) => b.dataset.conditionKey);
    expect(checked).toEqual(["dor-grave"]);
  });

  test("puts a condition's reminder in its tooltip", () => {
    renderResumeConditions({}, { conditions: CATALOG }, {});

    const label = container()
      .querySelector('.condition-toggle[data-condition-key="tosse-ou-espirro"]')
      .closest("label");
    expect(label.title).toBe("Não pode usar a perícia Furtividade.");
  });

  test("starts collapsed and carries the clear button", () => {
    renderResumeConditions({}, { conditions: CATALOG }, {});

    expect(container().querySelector(".resume-collapse-body").hidden).toBe(
      true,
    );
    expect(container().querySelector(".conditions-clear").textContent).toBe(
      t("conditions.clear"),
    );
  });
});

describe("escaping", () => {
  test("a hostile condition name renders as inert text everywhere", () => {
    const HOSTILE = "<img src=x onerror=alert(1)>";
    const catalog = [row("atordoamento-fisico", HOSTILE, "Atordoamento")];

    renderResumeConditions(
      sheetWith(
        resolved({ active: [{ key: "atordoamento-fisico", name: HOSTILE }] }),
      ),
      { conditions: catalog },
      { conditions: { "atordoamento-fisico": true } },
    );

    expect(container().querySelector("img")).toBeNull();
    expect(container().textContent).toContain(HOSTILE);
  });
});

describe("with the sheet the real engine builds", () => {
  const catalog = [...loadDataset("CONDITIONS")];
  const flags = {
    "atordoamento-mental": true,
    "dor-grave": true,
    sufocamento: true,
  };
  const sheet = buildSheet({
    character: {
      advantages: [ADVANTAGE.naoRespira],
      primaryAttributes: { ST: {}, DX: {}, IQ: {}, HT: {} },
      conditions: Object.keys(flags),
    },
    inventory: {},
  });

  beforeEach(() => {
    renderResumeConditions(
      sheet,
      { conditions: catalog },
      { conditions: flags },
    );
  });

  test("sums the stack of pain and stun into one summary line", () => {
    expect(container().querySelector(".conditions-summary").textContent).toBe(
      "DX −4 · IQ −4 · Perícias −4 · Autocontrole −4 · Defesas −4 · Atordoado",
    );
  });

  test("lists the two that apply and marks the immune one", () => {
    const keys = (selector) =>
      [...container().querySelectorAll(selector)].map(
        (button) => button.dataset.conditionKey,
      );

    expect(keys(".condition-entry .condition-remove")).toEqual([
      "atordoamento-mental",
      "dor-grave",
      "sufocamento",
    ]);
    expect(keys(".condition-entry--immune .condition-remove")).toEqual([
      "sufocamento",
    ]);
  });

  test("gives the recovery roll of the mental stun the numbers the engine computed, penalties included", () => {
    const { Will } = sheet.character.secondary_attributes;
    const { IQ } = sheet.character.primary_attributes;
    const entry = container()
      .querySelector(
        '.condition-remove[data-condition-key="atordoamento-mental"]',
      )
      .closest(".condition-entry");

    expect(Will.effective_value).toBeUndefined();
    expect(IQ.effective_value).toBeLessThan(IQ.value);
    expect(entry.textContent.replace(/\s+/g, " ")).toContain(
      `Recuperação: Vontade ${Will.value} ou IQ ${IQ.effective_value} (${IQ.value}) a cada turno`,
    );
  });

  test("disables the checkbox the character is immune to, and only that one", () => {
    const disabled = [
      ...container().querySelectorAll(".condition-toggle:disabled"),
    ].map((b) => b.dataset.conditionKey);
    expect(disabled).toEqual(
      loadDataset("CONDITIONS")
        .filter((row) =>
          row.condition_immune_trait_keys.includes("nao-respira"),
        )
        .map((row) => row.condition_key),
    );
  });
});
