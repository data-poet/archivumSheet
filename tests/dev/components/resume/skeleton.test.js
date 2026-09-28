import { mountResumePanel } from "dev/public/js/components/resume/skeleton.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// Every id a renderer in components/resume/ looks up, plus the legacy weight spans
// updateActualValues() reads. A rename here breaks the sheet silently, hence the guard.
const REQUIRED_IDS = [
  "tab-char-resume",
  "resume-charimg-wrapper",
  "resume_header_name",
  "resume_primary_attrs",
  "resume_bar_hp",
  "resume_bar_mana",
  "resume_bar_toxicity",
  "resume_secondary_snapshot",
  "resume_elemental_resistances_container",
  "resume_advantages_container",
  "resume_disadvantages_container",
  "resume_skills_container",
  "resume_magic_container",
  "resume_armor_container",
  "resume_shield_container",
  "resume_melee_container",
  "resume_ranged_container",
  "resume_firearms_container",
  "resume_ammo_container",
  "resume_alchemy_container",
  "resume_weight_tbody",
  "resume_total_weight_cell",
  "resume_value_tbody",
  "resume_total_value_cell",
  "resume_coins_row",
  "encumbrance",
  "carry_limits",
  "armor_weight",
  "shield_weight",
  "melee_weight",
  "ranged_weight",
  "firearms_weight",
  "ammo_weight",
  "alchemy_weight",
  "survival_gear_weight",
  "magic_gear_weight",
  "custom_inventory_weight",
  "total_weight",
];

beforeEach(() => {
  resetDOM();
});

describe("mountResumePanel", () => {
  test("no-ops when the host is missing", () => {
    expect(() => mountResumePanel()).not.toThrow();
    expect(document.getElementById("tab-char-resume")).toBeNull();
  });

  test("mounts the panel into the host", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    const panel = document.getElementById("tab-char-resume");
    expect(panel).not.toBeNull();
    expect(panel.parentElement.id).toBe("resume-panel-host");
  });

  test("exposes every id the resume renderers look up", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    const missing = REQUIRED_IDS.filter((id) => !document.getElementById(id));
    expect(missing).toEqual([]);
  });

  test("leaves the portrait wrapper and collapsible bodies hidden", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    expect(document.getElementById("resume-charimg-wrapper").hidden).toBe(true);
    expect(document.getElementById("resume_weight_tbody").hidden).toBe(true);
    expect(document.getElementById("resume_value_tbody").hidden).toBe(true);
    expect(document.getElementById("resume_coins_row").hidden).toBe(true);
  });

  test("is idempotent — a second call does not duplicate the panel", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();
    const first = document.getElementById("tab-char-resume");
    mountResumePanel();

    expect(document.querySelectorAll("#tab-char-resume")).toHaveLength(1);
    expect(document.getElementById("tab-char-resume")).toBe(first);
  });

  test("accepts a custom host id, so a second page can mount its own", () => {
    resetDOM(`<div id="allies-resume-host"></div>`);

    mountResumePanel("allies-resume-host");

    expect(document.getElementById("tab-char-resume").parentElement.id).toBe(
      "allies-resume-host",
    );
  });

  test("the markup carries no stray inputs — renderers add every control", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    expect(
      document.getElementById("tab-char-resume").querySelectorAll("input"),
    ).toHaveLength(0);
  });
});
