import {
  renderThresholds,
  thresholdChip,
} from "dev/public/js/components/thresholds.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const thresholds = (hpState = "ok", fpState = "ok", deathChecks = 0) => ({
  ht: 12,
  hp: {
    major_wound_over: 16,
    head_stun_over: 32 / 3,
    reeling_below: 32 / 3,
    death_checks_from: -12,
    death_check_step: 12,
    death_check_values: [-12, -24, -36, -48],
    next_death_check: -12,
    death_at: -60,
    destroyed_at: -120,
    state: hpState,
    death_checks: deathChecks,
  },
  fp: { exhausted_below: 4, unconscious_at: -12, state: fpState },
});

beforeEach(() => {
  resetDOM();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="thresholdsPanel"></div>`,
  );
});

describe("renderThresholds", () => {
  test("lists limits number-first, rounded to whole numbers, with short effects", () => {
    renderThresholds({ character: { thresholds: thresholds() } });
    const rows = Array.from(
      document.querySelectorAll("#thresholdsPanel tbody tr"),
      (tr) => Array.from(tr.children, (td) => td.textContent.trim()),
    );

    expect(rows).toEqual([
      ["> 16 por golpe", "Ferimento Grave"],
      ["> 11 no crânio", "Atordoado"],
      ["< 11", "Desl/Esq ½"],
      ["≤ 0", "HT por turno"],
      ["-12 · -24 · -36 · -48", "Teste de morte"],
      ["-60", "Morto"],
      ["-120", "Destruído"],
      ["< 4", "Exausto: Desl/Esq/ST ½"],
      ["≤ 0", "Vontade para agir"],
      ["-12", "Inconsciente"],
    ]);
    expect(document.querySelector(".thresholds-ht").textContent).toBe(
      "Baseado em HT 12",
    );
  });

  test("shows the no-effects chip when nothing is crossed, and short state chips otherwise", () => {
    renderThresholds({ character: { thresholds: thresholds() } });
    expect(document.querySelector(".threshold-chip--ok").textContent).toBe(
      LABELS.thresholds.noEffects,
    );

    renderThresholds({
      character: { thresholds: thresholds("dying", "exhausted", 2) },
    });
    const chips = Array.from(
      document.querySelectorAll(".threshold-chip"),
      (c) => c.textContent,
    );
    expect(chips).toEqual(["2 testes de morte", "Exausto: Desl/Esq/ST ½"]);
  });

  test("uses the singular for one death check", () => {
    expect(thresholdChip("hp", { state: "dying", death_checks: 1 })).toContain(
      "1 teste de morte",
    );
  });

  test("does nothing without thresholds", () => {
    renderThresholds({ character: {} });
    expect(document.getElementById("thresholdsPanel").innerHTML).toBe("");
  });
});

describe("thresholdChip", () => {
  test("is empty for the ok state and for unknown kinds", () => {
    expect(thresholdChip("hp", { state: "ok" })).toBe("");
    expect(thresholdChip("xx", { state: "reeling" })).toBe("");
  });
});
