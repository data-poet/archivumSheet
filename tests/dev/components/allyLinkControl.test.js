jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveKind: jest.fn(() => "character"),
  getActiveCharacterId: jest.fn(() => "c-ally-1"),
  listCharacters: jest.fn(() => []),
  getAllyOwnerId: jest.fn(() => null),
  linkAllyToCharacter: jest.fn(),
  unlinkAlly: jest.fn(),
}));

import {
  getActiveKind,
  getActiveCharacterId,
  listCharacters,
  getAllyOwnerId,
  linkAllyToCharacter,
  unlinkAlly,
} from "dev/public/js/store/characters.js";
import { renderAllyLinkControl } from "dev/public/js/components/allyLinkControl.js";

beforeEach(() => {
  document.body.innerHTML = `<table><tbody><tr><td id="ally-link-control"></td></tr></tbody></table>`;
  jest.clearAllMocks();
  getActiveKind.mockReturnValue("character");
  getActiveCharacterId.mockReturnValue("c-ally-1");
  listCharacters.mockReturnValue([
    { id: "pc-1", name: "Aria", race: "", kind: "character" },
    { id: "pc-2", name: "Borin", race: "", kind: "character" },
    { id: "c-ally-2", name: "Rex", race: "", kind: "ally" },
  ]);
  getAllyOwnerId.mockReturnValue(null);
});

describe("renderAllyLinkControl", () => {
  test("renders nothing when the active entry isn't an ally", () => {
    renderAllyLinkControl();
    expect(document.getElementById("ally-link-control").innerHTML).toBe("");
  });

  test("lists real characters only, excluding other allies (decision #24)", () => {
    getActiveKind.mockReturnValue("ally");
    renderAllyLinkControl();

    const options = [...document.querySelectorAll("#ally-link-select option")].map(
      (o) => o.value,
    );
    expect(options).toEqual(["", "pc-1", "pc-2"]);
  });

  test("preselects the current owner", () => {
    getActiveKind.mockReturnValue("ally");
    getAllyOwnerId.mockReturnValue("pc-2");

    renderAllyLinkControl();

    expect(document.getElementById("ally-link-select").value).toBe("pc-2");
  });

  test("selecting a character links the active ally to it", () => {
    getActiveKind.mockReturnValue("ally");
    renderAllyLinkControl();

    const select = document.getElementById("ally-link-select");
    select.value = "pc-1";
    select.dispatchEvent(new Event("change"));

    expect(linkAllyToCharacter).toHaveBeenCalledWith("c-ally-1", "pc-1");
    expect(unlinkAlly).not.toHaveBeenCalled();
  });

  test("selecting 'none' unlinks the active ally", () => {
    getActiveKind.mockReturnValue("ally");
    getAllyOwnerId.mockReturnValue("pc-1");
    renderAllyLinkControl();

    const select = document.getElementById("ally-link-select");
    select.value = "";
    select.dispatchEvent(new Event("change"));

    expect(unlinkAlly).toHaveBeenCalledWith("c-ally-1");
    expect(linkAllyToCharacter).not.toHaveBeenCalled();
  });
});
