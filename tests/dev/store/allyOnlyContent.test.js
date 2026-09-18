// The player audience discards ally-only rows on arrival, so the sheet cannot tell an
// ally-only id from a nonexistent one. availability.js records what it dropped; this turns
// that record into "what is this character holding that it should not".
import {
  AUDIENCE,
  availableFor,
  resetAudienceRecord,
} from "dev/public/js/shared/availability.js";
import { findAllyOnlyContent } from "dev/public/js/store/allyOnlyContent.js";
import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const ALLY_ROWS = [
  {
    advantage_id: "ADV-ALLY-1",
    advantage_name: "Corpo Elemental",
    available_for: "ally",
  },
  { race_id: "RACE-ELEM", race_name: "Elemental", available_for: "ally" },
  {
    armor_id: "ARMOR-ALLY-1",
    armor_name: "Casca de Pedra",
    available_for: "ally",
  },
  { skill_id: "SKILL-ALLY-1", available_for: "ally" },
];

function primeFilter() {
  availableFor([...ALLY_ROWS, { advantage_id: "ADV-001" }], AUDIENCE.PLAYER, {
    record: true,
  });
}

beforeEach(() => {
  resetState();
  resetAudienceRecord();
});

test("reports nothing when the filter never dropped anything", () => {
  state.selected.advantages = { "ADV-ALLY-1": {} };

  expect(findAllyOnlyContent()).toEqual([]);
});

describe("with ally-only rows recorded", () => {
  beforeEach(primeFilter);

  test("reports nothing for a clean character", () => {
    state.selected.advantages = { "ADV-001": {} };

    expect(findAllyOnlyContent()).toEqual([]);
  });

  test("finds an ally-only trait, labelled by its name column", () => {
    state.selected.advantages = { "ADV-001": {}, "ADV-ALLY-1": {} };

    expect(findAllyOnlyContent()).toEqual([
      { id: "ADV-ALLY-1", label: "Corpo Elemental" },
    ]);
  });

  test("finds an ally-only race", () => {
    state.selected.character.race_id = "RACE-ELEM";

    expect(findAllyOnlyContent()).toEqual([
      { id: "RACE-ELEM", label: "Elemental" },
    ]);
  });

  test("finds an ally-only item nested in an inventory entry", () => {
    state.selected.armors = [
      {
        _instanceId: "armor-1",
        armor_id: "ARMOR-ALLY-1",
        material_id: "MAT-000",
      },
    ];

    expect(findAllyOnlyContent()).toEqual([
      { id: "ARMOR-ALLY-1", label: "Casca de Pedra" },
    ]);
  });

  test("falls back to the bare id when the row has no name column", () => {
    state.selected.skills = { "SKILL-ALLY-1": { base_value: 10 } };

    expect(findAllyOnlyContent()).toEqual([
      { id: "SKILL-ALLY-1", label: "SKILL-ALLY-1" },
    ]);
  });

  test("reports each offender once even when held twice", () => {
    state.selected.armors = [
      { _instanceId: "armor-1", armor_id: "ARMOR-ALLY-1" },
      { _instanceId: "armor-2", armor_id: "ARMOR-ALLY-1" },
    ];

    expect(findAllyOnlyContent()).toHaveLength(1);
  });

  test("collects offenders across every collection at once", () => {
    state.selected.advantages = { "ADV-ALLY-1": {} };
    state.selected.character.race_id = "RACE-ELEM";
    state.selected.armors = [{ armor_id: "ARMOR-ALLY-1" }];

    const ids = findAllyOnlyContent().map((o) => o.id);

    expect(ids.sort()).toEqual(["ADV-ALLY-1", "ARMOR-ALLY-1", "RACE-ELEM"]);
  });

  test("ignores ids that were never dropped", () => {
    state.selected.armors = [{ armor_id: "ARMOR-015", material_id: "MAT-000" }];

    expect(findAllyOnlyContent()).toEqual([]);
  });
});
