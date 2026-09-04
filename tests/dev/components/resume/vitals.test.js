import { renderResume } from "dev/public/js/components/resume.js";
import {
  t,
  getSecondaryAttributeLabel,
} from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResume — orchestration", () => {
  test("touches every managed container, even with a bare-minimum sheet", () => {
    renderResume({}, {}, {});

    // Spot-check one container per section family — this just locks in
    // that renderResume() reaches every part of the panel on every call.
    expect(id("resume_header_name").textContent).toBe("");
    expect(id("resume_primary_attrs").innerHTML).toBe("");
    expect(id("resume_weight_tbody").innerHTML).not.toBe("");
    expect(id("resume_points_tbody").innerHTML).not.toBe("");
  });

  test("defaults data/selected to {} when omitted, without throwing", () => {
    expect(() => renderResume({})).not.toThrow();
  });
});

describe("renderResumeHeader", () => {
  test("shows the character name and sub-race separated by a pipe", () => {
    renderResume({
      pc: { character_name: "Aria" },
      race: { race_sub_name: "Elfo Alto" },
    });
    expect(id("resume_header_name").textContent).toBe("Aria | Elfo Alto");
  });

  test("shows just the name when there's no sub-race, with no dangling separator", () => {
    renderResume({ pc: { character_name: "Aria" } });
    expect(id("resume_header_name").textContent).toBe("Aria");
  });

  test("is a no-op when the header element is missing", () => {
    id("resume_header_name").remove();
    expect(() =>
      renderResume({ pc: { character_name: "Aria" } }),
    ).not.toThrow();
  });
});

describe("renderResumePrimaryAttributes", () => {
  const primary = {
    ST: { value: 12, modifier: 1 },
    DX: { value: 11, modifier: 0 },
    IQ: { value: 13, modifier: -1 },
    HT: { value: 10, modifier: 0 },
  };

  test("renders a box with value and modifier stepper per primary attribute", () => {
    renderResume({ character: { primary_attributes: primary } });

    const boxes = document.querySelectorAll(".resume-attr-box");
    expect(boxes).toHaveLength(4);
    const stInput = boxes[0].querySelector(".resume-primary-mod-input");
    expect(boxes[0].querySelector(".resume-attr-value").textContent).toBe("12");
    expect(stInput.dataset.attr).toBe("ST");
    expect(stInput.value).toBe("1");
  });

  test("shows an em-dash for a missing attribute's value", () => {
    renderResume({ character: { primary_attributes: { ST: {} } } });
    expect(
      document.querySelector(".resume-attr-box .resume-attr-value").textContent,
    ).toBe("—");
  });

  test("clears the container when there are no primary attributes yet", () => {
    id("resume_primary_attrs").innerHTML = "<div>stale</div>";
    renderResume({ character: {} });
    expect(id("resume_primary_attrs").innerHTML).toBe("");
  });
});

describe("renderResumeBars", () => {
  test("is a no-op (bars untouched) when there are no secondary attributes at all", () => {
    id("resume_bar_hp").innerHTML = "<div>stale</div>";
    renderResume({ character: {} });
    expect(id("resume_bar_hp").innerHTML).toBe("<div>stale</div>");
  });

  test("computes current/total from final_base_value + enchantment_modifier + modifier", () => {
    renderResume({
      character: {
        secondary_attributes: {
          HP: { final_base_value: 12, enchantment_modifier: 2, modifier: -3 },
        },
      },
    });

    const bar = id("resume_bar_hp");
    expect(bar.textContent).toContain("11/14"); // current = max(0, 14-3), total = 14
    const fill = bar.querySelector(".resume-bar-fill");
    expect(fill.style.width).toBe("79%"); // round(11/14*100)
  });

  test("falls back to (base_value + bought*4) when final_base_value is absent", () => {
    renderResume({
      character: {
        secondary_attributes: {
          Mana: { base_value: 10, bought: 2, modifier: 0 },
        },
      },
    });
    expect(id("resume_bar_mana").textContent).toContain("18/18"); // 10 + 2*4
  });

  test("clamps current at 0 rather than going negative", () => {
    renderResume({
      character: {
        secondary_attributes: {
          Toxicity: { final_base_value: 5, modifier: -20 },
        },
      },
    });
    expect(id("resume_bar_toxicity").textContent).toContain("0/5");
  });

  test("reports 0% when the total is 0 (avoids a divide-by-zero)", () => {
    renderResume({
      character: {
        secondary_attributes: { HP: { final_base_value: 0, modifier: 0 } },
      },
    });
    const fill = id("resume_bar_hp").querySelector(".resume-bar-fill");
    expect(fill.style.width).toBe("0%");
  });

  test("is a no-op for an individual bar whose attribute is missing", () => {
    id("resume_bar_mana").innerHTML = "<div>stale</div>";
    renderResume({
      character: {
        secondary_attributes: { HP: { final_base_value: 10, modifier: 0 } },
      },
    });
    expect(id("resume_bar_mana").innerHTML).toBe("<div>stale</div>");
  });
});

describe("renderResumeSecondarySnapshot", () => {
  test("renders one row per known key present on the sheet, formatted per-key", () => {
    renderResume({
      character: {
        secondary_attributes: {
          Will: { value: 12, modifier: 1 },
          BasicSpeed: { value: 5.5, modifier: 0.5 },
        },
      },
    });

    const rows = document.querySelectorAll("#resume_secondary_snapshot tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain(getSecondaryAttributeLabel("Will"));
    expect(rows[0].querySelector("td.col-num").textContent).toBe("12");

    const speedRow = rows[1];
    expect(speedRow.querySelector("td.col-num").textContent).toBe("5.50"); // toFixed(2)
    const stepper = speedRow.querySelector(".secondary-input");
    expect(stepper.dataset.step).toBe("0.5"); // BasicSpeed steps by 0.5
  });

  test("skips a known key entirely when it's absent from the sheet", () => {
    renderResume({
      character: { secondary_attributes: { Will: { value: 1 } } },
    });
    expect(
      document.querySelectorAll("#resume_secondary_snapshot tr"),
    ).toHaveLength(1);
  });

  test("clears the container when there are no secondary attributes at all", () => {
    id("resume_secondary_snapshot").innerHTML = "<div>stale</div>";
    renderResume({ character: {} });
    expect(id("resume_secondary_snapshot").innerHTML).toBe("");
  });
});

describe("collapsible sections — shared infrastructure (first exercised here via secondarySnapshot)", () => {
  const sheetWithSnapshot = {
    character: { secondary_attributes: { Will: { value: 10, modifier: 0 } } },
  };

  // _collapseOpen (resume.js) is a module-level singleton keyed by title, so a click in one test persists into later tests — each test below normalizes state first.
  function toggleBtn(container) {
    return container.querySelector(".resume-section-toggle");
  }
  function isOpen(container) {
    return container.querySelector(".resume-collapse-body").hidden === false;
  }
  function ensureCollapsed(container) {
    if (isOpen(container)) toggleBtn(container).click();
  }
  function ensureOpen(container) {
    if (!isOpen(container)) toggleBtn(container).click();
  }

  test("renders collapsed (hidden body) by default the first time a title is ever seen", () => {
    // Only meaningful in isolation (fresh module instance) — later tests intentionally flip this shared state.
    renderResume(sheetWithSnapshot);
    const container = id("resume_secondary_snapshot");
    ensureCollapsed(container);
    expect(container.querySelector(".resume-collapse-body").hidden).toBe(true);
    expect(toggleBtn(container).getAttribute("aria-expanded")).toBe("false");
  });

  test("clicking the toggle button expands the section and updates aria-expanded", () => {
    renderResume(sheetWithSnapshot);
    const container = id("resume_secondary_snapshot");
    ensureCollapsed(container);

    toggleBtn(container).click();

    expect(container.querySelector(".resume-collapse-body").hidden).toBe(false);
    expect(toggleBtn(container).getAttribute("aria-expanded")).toBe("true");
    expect(
      container
        .querySelector(".resume-expander-arrow")
        .classList.contains("resume-expander-arrow--open"),
    ).toBe(true);
  });

  test("expanded state survives a subsequent renderResume() call (engine recompute)", () => {
    renderResume(sheetWithSnapshot);
    ensureOpen(id("resume_secondary_snapshot"));

    // Simulate a fresh engine run re-rendering the whole panel
    renderResume({
      character: {
        secondary_attributes: { Will: { value: 11, modifier: 0 } }, // different value
      },
    });

    const container = id("resume_secondary_snapshot");
    expect(container.querySelector(".resume-collapse-body").hidden).toBe(false);
    expect(container.textContent).toContain("11"); // content did refresh
  });

  test("clicking the toggle a second time collapses it again", () => {
    renderResume(sheetWithSnapshot);
    const container = id("resume_secondary_snapshot");
    ensureOpen(container);

    toggleBtn(container).click();

    expect(container.querySelector(".resume-collapse-body").hidden).toBe(true);
  });

  test("a click elsewhere in the document is ignored", () => {
    renderResume(sheetWithSnapshot);
    const container = id("resume_secondary_snapshot");
    ensureCollapsed(container);

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(container.querySelector(".resume-collapse-body").hidden).toBe(true);
  });
});
