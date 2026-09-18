// The premise of the whole feature: an ally is a character, so every shipped catalog
// payload must run through the unmodified engine via the same mapper the sheet uses.
// If this breaks, either the catalog shape or the mapper has drifted.
//
// Lives under tests/dev/ rather than tests/engine/ because it imports the client-side
// mapper; the engine project is deliberately kept to plain CommonJS (see jest.config.js).
import { toEnginePayload } from "dev/public/js/shared/enginePayload.js";

const { getAlly, listAllies } = require("helpers/alliesCatalog.js");
const { buildSheet } = require("engine/buildSheet.js");

const ALLY_IDS = listAllies().map((entry) => entry.ally_id);

test("the catalog is not empty, so the cases below are real", () => {
  expect(ALLY_IDS.length).toBeGreaterThan(0);
});

describe.each(ALLY_IDS)("%s", (allyId) => {
  const sheet = buildSheet(toEnginePayload(getAlly(allyId)));

  test("resolves primary and secondary attributes", () => {
    expect(sheet.character.primary_attributes.ST.value).toBeGreaterThan(0);
    expect(sheet.character.secondary_attributes.HP.value).toBeGreaterThan(0);
    expect(sheet.character.secondary_attributes.Dodge.value).toBeGreaterThan(0);
  });

  test("resolves equipped equipment and carry weight", () => {
    expect(sheet.inventory.carry_weight).toBeDefined();
    expect(sheet.inventory.armor.equipped).toBeDefined();
  });

  test("resolves every purchased skill", () => {
    const purchased = Object.keys(getAlly(allyId).character.skills);

    purchased.forEach((skillId) => {
      expect(sheet.character.skills[skillId]).toBeDefined();
    });
  });

  test("applies the race's innate traits on top of the ally's own", () => {
    const ally = getAlly(allyId);
    const own = Object.keys(ally.character.advantages).length;
    const innate = ally.race.innate_advantage_ids?.length ?? 0;

    expect(Object.keys(sheet.character.advantages).length).toBe(own + innate);
  });
});
