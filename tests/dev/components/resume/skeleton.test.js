import {
  mountResumePanel,
  initResumeGroupNav,
} from "dev/public/js/components/resume/skeleton.js";
import { RESUME_LAYOUT } from "dev/public/js/layout/resumeLayout.js";
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
  "resume_conditions_container",
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
  // The panel's own copy of the XP bar and points table — see vitals.js/totals.js, which
  // write to these and their edit-page counterparts (outside the panel) alike.
  "resume_bar_experience_panel",
  "resume_points_tbody_panel",
  "resume_total_points_cell_panel",
];

// One per RESUME_LAYOUT section (layout/resumeLayout.js) — groupNav hides/shows these by
// group; a renamed or dropped one here would silently stop being reachable from any group.
const REQUIRED_SECTIONS = [
  "resume-section-status",
  "resume-section-armor",
  "resume-section-shield",
  "resume-section-melee",
  "resume-section-ranged",
  "resume-section-firearms",
  "resume-section-supplies",
  "resume-section-alchemy",
  "resume-section-attributes",
  "resume-section-advantages",
  "resume-section-disadvantages",
  "resume-section-skills",
  "resume-section-magic",
  "resume-section-weight",
  "resume-section-value",
  "resume-section-points",
];

beforeEach(() => {
  resetDOM();
  window.scrollTo = jest.fn(); // jsdom has no layout, so this would otherwise log a not-implemented error
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

  test("every RESUME_LAYOUT section exists as an .l-section inside the panel", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    const missing = REQUIRED_SECTIONS.filter(
      (id) => !document.querySelector(`#tab-char-resume .l-section#${id}`),
    );
    expect(missing).toEqual([]);
  });

  // The vitals header must never be hidden by a group switch — it's a sibling of
  // .resume-groups, not one of the .l-section elements groupNav toggles.
  test("the header (name + vitals) sits outside .resume-groups", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);

    mountResumePanel();

    const header = document.querySelector("#tab-char-resume .resume-header");
    expect(header.querySelector("#resume_header_name")).not.toBeNull();
    expect(header.querySelector("#resume_bar_hp")).not.toBeNull();
    expect(header.querySelector(".l-section")).toBeNull();
  });
});

describe("initResumeGroupNav", () => {
  test("does not throw when the panel hasn't been mounted", () => {
    resetDOM();
    expect(() => initResumeGroupNav()).not.toThrow();
  });

  test("renders one tab per RESUME_LAYOUT group and shows only the first group's sections", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);
    mountResumePanel();

    initResumeGroupNav();

    const buttons = document.querySelectorAll("#resume-groupnav .groupnav-btn");
    expect(buttons).toHaveLength(RESUME_LAYOUT.length);
    expect(buttons[0].dataset.group).toBe(RESUME_LAYOUT[0].group);

    const firstGroupSections = new Set(
      RESUME_LAYOUT[0].sections.map((s) => s.id),
    );
    REQUIRED_SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      expect(section.hidden).toBe(!firstGroupSections.has(id));
    });
  });

  test("switching groups shows only that group's sections, leaving the header alone", () => {
    resetDOM(`<div id="resume-panel-host"></div>`);
    mountResumePanel();
    initResumeGroupNav();

    const secondGroup = RESUME_LAYOUT[1];
    document
      .querySelector(`.groupnav-btn[data-group="${secondGroup.group}"]`)
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const secondGroupSections = new Set(secondGroup.sections.map((s) => s.id));
    REQUIRED_SECTIONS.forEach((id) => {
      expect(document.getElementById(id).hidden).toBe(
        !secondGroupSections.has(id),
      );
    });
    expect(document.getElementById("resume_header_name")).not.toBeNull();
  });
});
