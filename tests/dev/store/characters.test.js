// characters.js pulls in a wide dependency tree. state.js, compute/attributes.js
// (via the DOM fixture), and store/instanceId.js are used FOR REAL here —
// they're already covered by their own batches and characters.js's contract
// genuinely depends on how they behave. ui.js, compute/autorun.js, and the
// race/portrait render modules are mocked: they're side-effecting render
// calls whose job is just "did characters.js call you", not logic this
// module owns.
jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/races/model.js", () => ({
  restoreRaceSelection: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/portrait/portrait.js", () => ({
  renderCharacterImage: jest.fn(),
  renderResumeImage: jest.fn(),
}));

import { renderListsPreserving } from "dev/public/js/ui.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { restoreRaceSelection } from "dev/public/js/engine/character/races/model.js";
import {
  renderCharacterImage,
  renderResumeImage,
} from "dev/public/js/engine/character/portrait/portrait.js";
import { state } from "dev/public/js/state.js";
import { nextArmorInstanceId } from "dev/public/js/store/instanceId.js";
import {
  getStore,
  listCharacters,
  getActiveCharacterId,
  saveActiveCharacter,
  loadCharacter,
  addCharacter,
  removeCharacter,
  replaceActiveCharacter,
  initCharacters,
} from "dev/public/js/store/characters.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const STORAGE_KEY = "archivum_characters";

beforeEach(() => {
  localStorage.clear();
  resetDOM();
  resetState();
  jest.clearAllMocks();
});

describe("getStore", () => {
  test("initializes a store with one blank character on first run", () => {
    const store = getStore();
    expect(store.list).toHaveLength(1);
    expect(store.list[0].name).toBe("Personagem 1");
    expect(store.activeId).toBe(store.list[0].id);
  });

  test("persists the initialized store so a second call doesn't recreate it", () => {
    const first = getStore();
    const second = getStore();
    expect(second.activeId).toBe(first.activeId);
    expect(second.list[0].id).toBe(first.list[0].id);
  });
});

describe("listCharacters / getActiveCharacterId", () => {
  test("lists id, name, and race only", () => {
    const list = listCharacters();
    expect(list).toEqual([
      { id: expect.any(String), name: "Personagem 1", race: "" },
    ]);
  });

  test("returns the active character's id", () => {
    const store = getStore();
    expect(getActiveCharacterId()).toBe(store.activeId);
  });
});

describe("saveActiveCharacter", () => {
  test("captures primary attributes from the DOM into the active slot", () => {
    document.getElementById("ST_base").value = "13";
    document.getElementById("ST_mod").value = "1";

    saveActiveCharacter();

    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(raw.list[0].data.character.primary.ST).toEqual({
      base_value: 13,
      modifier: 1,
    });
  });

  test("captures inventory arrays from state.selected", () => {
    state.selected.armors = [{ instance_id: "armor-inst-1", armor_id: "A1" }];

    saveActiveCharacter();

    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(raw.list[0].data.inventory.armors).toEqual([
      { instance_id: "armor-inst-1", armor_id: "A1" },
    ]);
  });

  test("updates the display name from the current character name when non-empty", () => {
    state.selected.character.character_name = "Aria Nightshade";

    saveActiveCharacter();

    expect(listCharacters()[0].name).toBe("Aria Nightshade");
  });

  test("does not overwrite the display name when the current character name is blank", () => {
    saveActiveCharacter();
    expect(listCharacters()[0].name).toBe("Personagem 1");
  });

  test("updates the display race, preferring race_sub_name over race_name", () => {
    state.data.races = [
      { race_id: "R1", race_name: "Elfo", race_sub_name: "Elfo Silvestre" },
    ];
    state.selected.character.race_id = "R1";

    saveActiveCharacter();

    expect(listCharacters()[0].race).toBe("Elfo Silvestre");
  });

  test("falls back to race_name when race_sub_name is absent", () => {
    state.data.races = [{ race_id: "R2", race_name: "Anão" }];
    state.selected.character.race_id = "R2";

    saveActiveCharacter();

    expect(listCharacters()[0].race).toBe("Anão");
  });

  test("clears the display race when race_id is unset", () => {
    state.selected.character.race_id = null;
    saveActiveCharacter();
    expect(listCharacters()[0].race).toBe("");
  });
});

describe("loadCharacter", () => {
  test("hydrates state.selected from the stored data and re-renders", () => {
    const id = addCharacter("Second Character");
    state.selected.armors = [{ instance_id: "armor-inst-1" }];
    saveActiveCharacter();

    const firstId = getStore().list[0].id;
    jest.clearAllMocks();
    loadCharacter(firstId);

    expect(state.selected.character.character_name).toBe("");
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
    expect(renderCharacterImage).toHaveBeenCalledTimes(1);
    expect(renderResumeImage).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    void id;
  });

  test("writes PC-info fields into their DOM inputs", () => {
    state.selected.character.player_name = "Player One";
    saveActiveCharacter();
    document.getElementById("playerNameInput").value = "";

    loadCharacter(getStore().activeId);

    expect(document.getElementById("playerNameInput").value).toBe("Player One");
  });

  test("resets instance id counters so imported ids don't collide with new ones", () => {
    nextArmorInstanceId(); // armor-inst-1
    nextArmorInstanceId(); // armor-inst-2

    loadCharacter(getStore().activeId);

    expect(nextArmorInstanceId()).toBe("armor-inst-1");
  });

  test("restores race selection when the character has a race_id and races are loaded", () => {
    state.data.races = [{ race_id: "R1", race_name: "Elfo" }];
    state.selected.character.race_id = "R1";
    // race_id only round-trips through state.sheet.race — saveActiveCharacter
    // is documented as running "at the end of every runEngine()", and it's
    // runEngine that populates state.sheet. Without it, _captureCurrentData
    // falls back to an empty race object and race_id is lost, by design.
    state.sheet = { race: { race_id: "R1" } };
    saveActiveCharacter();

    loadCharacter(getStore().activeId);

    expect(restoreRaceSelection).toHaveBeenCalledWith("R1");
  });

  test("is a no-op for an unknown id", () => {
    loadCharacter("does-not-exist");
    expect(renderListsPreserving).not.toHaveBeenCalled();
  });

  test("switches the active id and persists it", () => {
    const secondId = addCharacter("Second Character");
    const firstId = getStore().list.find((c) => c.id !== secondId).id;

    loadCharacter(firstId);

    expect(getActiveCharacterId()).toBe(firstId);
  });
});

describe("addCharacter", () => {
  test("creates a blank character, activates it, and applies blank data", () => {
    const id = addCharacter("Bran the Bold");

    expect(getActiveCharacterId()).toBe(id);
    expect(listCharacters()).toContainEqual({
      id,
      name: "Bran the Bold",
      race: "",
    });
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
  });

  test("defaults to 'Novo Personagem' when no name is given", () => {
    const id = addCharacter();
    expect(listCharacters().find((c) => c.id === id).name).toBe(
      "Novo Personagem",
    );
  });
});

describe("removeCharacter", () => {
  test("removing one of several characters activates the next one", () => {
    const secondId = addCharacter("Second");
    const thirdId = addCharacter("Third");
    loadCharacter(secondId);

    removeCharacter(secondId);

    expect(getActiveCharacterId()).toBe(thirdId);
    expect(listCharacters().map((c) => c.id)).not.toContain(secondId);
  });

  test("removing the last item in the list falls back to the previous one", () => {
    const secondId = addCharacter("Second");
    loadCharacter(secondId);

    removeCharacter(secondId);

    const remaining = listCharacters();
    expect(remaining).toHaveLength(1);
    expect(getActiveCharacterId()).toBe(remaining[0].id);
  });

  test("removing the only character creates a fresh blank one", () => {
    const onlyId = getActiveCharacterId();

    removeCharacter(onlyId);

    const remaining = listCharacters();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).not.toBe(onlyId);
    expect(remaining[0].name).toBe("Personagem 1");
  });

  test("is a no-op for an unknown id", () => {
    const before = listCharacters();
    removeCharacter("does-not-exist");
    expect(listCharacters()).toEqual(before);
  });
});

describe("replaceActiveCharacter", () => {
  const payload = {
    version: 1,
    pc: { character_name: "Replaced Hero" },
    race: { race_id: null },
    character: {
      primary: { ST: { base_value: 14, modifier: 0 } },
      secondary: {},
      damage: {},
      resistances: {},
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    },
    inventory: {
      weight: 12,
      armors: [{ instance_id: "armor-inst-1" }],
      shields: [],
      melee_weapons: [],
      ranged_weapons: [],
      firearms: [],
      ammo_containers: [],
      loose_ammo: [],
      alchemy: [],
      survivalGear: [],
      accessories: [],
      magicGear: [],
      customInventory: [],
      coins: [],
    },
  };

  test("replaces the active slot's data and re-applies it to state", () => {
    replaceActiveCharacter(payload);

    expect(state.selected.character.character_name).toBe("Replaced Hero");
    expect(state.selected.armors).toEqual([{ instance_id: "armor-inst-1" }]);
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
  });

  test("updates the display name from the payload", () => {
    replaceActiveCharacter(payload);
    expect(listCharacters()[0].name).toBe("Replaced Hero");
  });

  test("is a no-op for a store with no matching active id", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeId: "ghost", list: [] }),
    );
    expect(() => replaceActiveCharacter(payload)).not.toThrow();
    expect(renderListsPreserving).not.toHaveBeenCalled();
  });
});

describe("initCharacters", () => {
  test("ensures a store exists and loads the active character", () => {
    initCharacters();
    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
    expect(getStore().list).toHaveLength(1);
  });
});

describe("round trip: save → switch away → switch back", () => {
  test("a non-trivial character's full shape survives intact", () => {
    document.getElementById("ST_base").value = "15";
    document.getElementById("ST_mod").value = "2";
    state.selected.character.character_name = "Round Trip Hero";
    state.selected.advantages = { "ADV-001": { level: 3 } };
    state.selected.skills = { "SK-001": { points: 4 } };
    state.selected.resistances = { Fire: { modifier: -0.5 } };
    state.selected.armors = [
      { instance_id: "armor-inst-1", armor_id: "ARM-001", enchantments: [] },
    ];
    state.selected.melee_weapons = [
      { instance_id: "melee-inst-1", weapon_id: "MEL-001" },
    ];
    state.selected.coins = [{ type: "gold", amount: 42 }];
    saveActiveCharacter();

    const originalId = getActiveCharacterId();
    const otherId = addCharacter("Someone Else"); // switches active + applies blank data
    void otherId;

    loadCharacter(originalId);

    expect(state.selected.character.character_name).toBe("Round Trip Hero");
    expect(state.selected.advantages).toEqual({ "ADV-001": { level: 3 } });
    expect(state.selected.skills).toEqual({ "SK-001": { points: 4 } });
    expect(state.selected.resistances).toEqual({
      Fire: { modifier: -0.5 },
    });
    expect(state.selected.armors).toEqual([
      { instance_id: "armor-inst-1", armor_id: "ARM-001", enchantments: [] },
    ]);
    expect(state.selected.melee_weapons).toEqual([
      { instance_id: "melee-inst-1", weapon_id: "MEL-001" },
    ]);
    expect(state.selected.coins).toEqual([{ type: "gold", amount: 42 }]);
    expect(document.getElementById("ST_base").value).toBe("15");
    expect(document.getElementById("ST_mod").value).toBe("2");
  });
});
