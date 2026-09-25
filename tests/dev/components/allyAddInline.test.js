jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveKind: jest.fn(() => "character"),
  getActiveCharacterId: jest.fn(() => "pc-1"),
  saveActiveCharacter: jest.fn(),
  loadCharacter: jest.fn(),
}));
jest.mock("dev/public/js/store/allies/characterLinking.js", () => ({
  forkAndLinkAllyToCharacter: jest.fn(),
}));
jest.mock("dev/public/js/allies/catalog.js", () => ({
  listAllies: jest.fn(),
}));
jest.mock("dev/public/js/shared/toast.js", () => ({
  showToast: jest.fn(),
}));

import {
  getActiveKind,
  getActiveCharacterId,
  saveActiveCharacter,
  loadCharacter,
} from "dev/public/js/store/characters.js";
import { forkAndLinkAllyToCharacter } from "dev/public/js/store/allies/characterLinking.js";
import { listAllies } from "dev/public/js/allies/catalog.js";
import { showToast } from "dev/public/js/shared/toast.js";
import {
  renderAllyAddControl,
  initAllyAddControl,
} from "dev/public/js/components/allies/allyAddInline.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";

const INDEX = [
  { ally_id: "ALLY_HUMANOID_001", name: "Bran", type: "humanoids", subtype: null },
  { ally_id: "ALLY_ANIMAL_001", name: "Lobo", type: "animals", subtype: null },
  { ally_id: "ALLY_ANIMAL_002", name: "Cavalo", type: "animals", subtype: "mounts" },
];

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = `<table><tbody><tr><td id="ally-add-control"></td></tr></tbody></table>`;
  jest.clearAllMocks();
  getActiveKind.mockReturnValue("character");
  getActiveCharacterId.mockReturnValue("pc-1");
  listAllies.mockResolvedValue(INDEX);
});

describe("renderAllyAddControl", () => {
  test("renders nothing when the active entry is an ally (decision #24)", () => {
    getActiveKind.mockReturnValue("ally");
    renderAllyAddControl();

    expect(document.getElementById("ally-add-control").innerHTML).toBe("");
  });

  test("renders the add box with static labels when active entry is a real character", async () => {
    await initAllyAddControl();

    expect(document.getElementById("ally-add-summary").textContent).toBe(
      t("allies.addToggle"),
    );
    expect(document.getElementById("ally-add-btn").textContent).toBe(
      t("allies.add"),
    );
  });

  test("populates the type select with every distinct type", async () => {
    await initAllyAddControl();

    const options = [...document.getElementById("ally-add-type").options].map(
      (o) => o.value,
    );
    expect(options.sort()).toEqual(["animals", "humanoids"]);
  });

  test("switching to a type with subtypes shows the subtype select with a 'none' option", async () => {
    await initAllyAddControl();

    const typeSelect = document.getElementById("ally-add-type");
    typeSelect.value = "animals";
    typeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    const options = [...document.getElementById("ally-add-subtype").options].map(
      (o) => o.value,
    );
    expect(options).toEqual(["", "mounts"]);
  });

  test("clicking add forks the selected ally under the active character and switches to it", async () => {
    forkAndLinkAllyToCharacter.mockResolvedValue("c-new-ally");
    await initAllyAddControl();

    document.getElementById("ally-add-btn").click();
    await flush();

    expect(saveActiveCharacter).toHaveBeenCalledTimes(1);
    expect(forkAndLinkAllyToCharacter).toHaveBeenCalledWith(
      "ALLY_ANIMAL_001",
      "pc-1",
    );
    expect(loadCharacter).toHaveBeenCalledWith("c-new-ally");
  });

  test("shows an error toast and does not switch when forking fails", async () => {
    forkAndLinkAllyToCharacter.mockResolvedValue(null);
    await initAllyAddControl();

    document.getElementById("ally-add-btn").click();
    await flush();

    expect(showToast).toHaveBeenCalledWith(t("allies.addError"), "error");
    expect(loadCharacter).not.toHaveBeenCalled();
  });
});
