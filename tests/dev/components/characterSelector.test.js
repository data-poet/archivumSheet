jest.mock("dev/public/js/store/characters.js", () => ({
  listCharacters: jest.fn(),
  getActiveCharacterId: jest.fn(),
  loadCharacter: jest.fn(),
  addCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  saveActiveCharacter: jest.fn(),
  replaceActiveCharacter: jest.fn(),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  exportSheet: jest.fn(),
  importSheet: jest.fn(),
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/components/dialog.js", () => ({
  showConfirm: jest.fn(),
}));

import {
  listCharacters,
  getActiveCharacterId,
  loadCharacter,
  addCharacter,
  removeCharacter,
  saveActiveCharacter,
  replaceActiveCharacter,
} from "dev/public/js/store/characters.js";
import { exportSheet, showToast } from "dev/public/js/store/persistence.js";
import { showConfirm } from "dev/public/js/components/dialog.js";
import {
  updateSelectorButton,
  openSelector,
  closeSelector,
  toggleSelector,
  renderPopover,
  initCharacterSelector,
} from "dev/public/js/components/characterSelector.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const flush = () => new Promise((r) => setTimeout(r, 20));

function selectorDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <button id="char-selector-btn"></button>
      <div id="char-selector-popover"></div>
      <input id="importFileInput" type="file" />
    `,
  );
}

function setFile(fakeFile) {
  const input = document.getElementById("importFileInput");
  Object.defineProperty(input, "files", {
    value: fakeFile ? [fakeFile] : [],
    configurable: true,
  });
  return input;
}

function fakeFile(content) {
  return { text: () => Promise.resolve(content) };
}

const CHARS = [
  { id: "c1", name: "Aria", race: "Elfo" },
  { id: "c2", name: "  ", race: "" },
];

beforeEach(() => {
  resetDOM();
  selectorDOM();
  jest.clearAllMocks();
  listCharacters.mockReturnValue(CHARS);
  getActiveCharacterId.mockReturnValue("c1");
});

describe("updateSelectorButton", () => {
  test("shows the active character's name and race", () => {
    updateSelectorButton();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.querySelector(".char-selector-btn-name").textContent).toBe(
      "Aria",
    );
    expect(btn.querySelector(".char-selector-btn-race").textContent).toBe(
      "Elfo",
    );
  });

  test("falls back to the 'unnamed' label when the active character's name is blank", () => {
    getActiveCharacterId.mockReturnValue("c2");
    updateSelectorButton();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.querySelector(".char-selector-btn-name").textContent).toBe(
      t("characters.unnamed"),
    );
  });

  test("omits the race span entirely when there's no race", () => {
    getActiveCharacterId.mockReturnValue("c2");
    updateSelectorButton();
    expect(
      document
        .getElementById("char-selector-btn")
        .querySelector(".char-selector-btn-race"),
    ).toBeNull();
  });

  test("does not throw when the button isn't in the DOM", () => {
    document.getElementById("char-selector-btn").remove();
    expect(() => updateSelectorButton()).not.toThrow();
  });
});

describe("renderPopover", () => {
  test("lists every character, marking the active one distinctly", () => {
    renderPopover();
    const items = document.querySelectorAll(".char-selector-item");
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains("is-active")).toBe(true);
    expect(items[0].getAttribute("aria-selected")).toBe("true");
    expect(items[0].querySelector(".char-selector-radio").textContent).toBe(
      "⦿",
    );
    expect(items[1].classList.contains("is-active")).toBe(false);
    expect(items[1].querySelector(".char-selector-radio").textContent).toBe(
      "○",
    );
  });

  test("falls back to 'unnamed' and omits race for a blank-named character", () => {
    renderPopover();
    const secondItem = document.querySelectorAll(".char-selector-item")[1];
    expect(
      secondItem.querySelector(".char-selector-item-name").textContent,
    ).toBe(t("characters.unnamed"));
    expect(secondItem.querySelector(".char-selector-item-race")).toBeNull();
  });

  test("renders all five action items with localized labels", () => {
    renderPopover();
    const actions = document.querySelectorAll(".char-selector-action-item");
    expect(actions).toHaveLength(5);
    const byAction = Object.fromEntries(
      Array.from(actions).map((a) => [a.dataset.action, a.textContent]),
    );
    expect(byAction["add-char"]).toContain(t("characters.add"));
    expect(byAction["remove-char"]).toContain(t("characters.remove"));
    expect(byAction["import-char"]).toContain(t("app.import"));
    expect(byAction["export-char"]).toContain(t("app.export"));
    expect(byAction["replace-char"]).toContain(t("characters.replace"));
  });

  test("does not throw when the popover isn't in the DOM", () => {
    document.getElementById("char-selector-popover").remove();
    expect(() => renderPopover()).not.toThrow();
  });
});

describe("openSelector / closeSelector / toggleSelector", () => {
  test("openSelector re-renders, adds is-open, and refreshes the button", () => {
    openSelector();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
    expect(document.querySelectorAll(".char-selector-item")).toHaveLength(2);
  });

  test("closeSelector removes is-open", () => {
    openSelector();
    closeSelector();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("toggleSelector opens when closed and closes when open", () => {
    toggleSelector();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
    toggleSelector();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });
});

describe("initCharacterSelector — button + outside click", () => {
  test("clicking the topbar button toggles the popover without the outside-click handler immediately re-closing it", () => {
    initCharacterSelector();
    document
      .getElementById("char-selector-btn")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
  });

  test("clicking outside the popover and button closes it", () => {
    initCharacterSelector();
    document.getElementById("char-selector-btn").click();

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("clicking inside the popover (not outside) does not close it", () => {
    initCharacterSelector();
    document.getElementById("char-selector-btn").click();

    document
      .getElementById("char-selector-popover")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(true);
  });
});

describe("initCharacterSelector — select-char", () => {
  test("selecting the already-active character just closes the popover", () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(saveActiveCharacter).not.toHaveBeenCalled();
    expect(loadCharacter).not.toHaveBeenCalled();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("selecting a different character saves the current one, loads the new one, and closes", () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(saveActiveCharacter).toHaveBeenCalledTimes(1);
    expect(loadCharacter).toHaveBeenCalledWith("c2");
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });
});

describe("initCharacterSelector — add-char", () => {
  let promptSpy;
  beforeEach(() => {
    promptSpy = jest.spyOn(window, "prompt");
  });
  afterEach(() => promptSpy.mockRestore());

  test("cancelling the prompt (returns null) does not add a character", () => {
    promptSpy.mockReturnValue(null);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(addCharacter).not.toHaveBeenCalled();
  });

  test("adds a character with the trimmed prompt value", () => {
    promptSpy.mockReturnValue("  Novo Herói  ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(addCharacter).toHaveBeenCalledWith("Novo Herói");
  });

  test("falls back to the default name when the prompt is submitted blank", () => {
    promptSpy.mockReturnValue("   ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(addCharacter).toHaveBeenCalledWith(t("characters.newCharacter"));
  });
});

describe("initCharacterSelector — remove-char", () => {
  test("refuses to remove the last remaining character", () => {
    listCharacters.mockReturnValue([CHARS[0]]);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="remove-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(showToast).toHaveBeenCalledWith(
      t("characters.cannotRemoveLast"),
      "error",
    );
    expect(removeCharacter).not.toHaveBeenCalled();
  });

  test("asks for confirmation, and does nothing when declined", async () => {
    showConfirm.mockResolvedValue(false);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="remove-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(showConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: t("characters.confirmRemoveTitle"),
        danger: true,
      }),
    );
    expect(removeCharacter).not.toHaveBeenCalled();
  });

  test("removes the active character once confirmed", async () => {
    showConfirm.mockResolvedValue(true);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="remove-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(removeCharacter).toHaveBeenCalledWith("c1");
  });
});

describe("initCharacterSelector — export/import/replace buttons", () => {
  test("export-char calls exportSheet and closes the popover", () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="export-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(exportSheet).toHaveBeenCalledTimes(1);
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("import-char arms the file input in 'import' mode and clicks it", () => {
    initCharacterSelector();
    openSelector();
    const input = document.getElementById("importFileInput");
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    document
      .querySelector('[data-action="import-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(input._mode).toBe("import");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test("replace-char arms the file input in 'replace' mode and clicks it", () => {
    initCharacterSelector();
    openSelector();
    const input = document.getElementById("importFileInput");
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    document
      .querySelector('[data-action="replace-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(input._mode).toBe("replace");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe("initCharacterSelector — file input handling", () => {
  const VALID_PAYLOAD = JSON.stringify({
    version: 1,
    character: {},
    inventory: {},
    pc: { character_name: "Importado" },
  });

  test("import mode: adds a new character slot, then replaces its data with the import", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(VALID_PAYLOAD));
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith("Importado");
    expect(replaceActiveCharacter).toHaveBeenCalledWith(
      JSON.parse(VALID_PAYLOAD),
    );
  });

  test("import mode falls back to the 'unnamed' label when the payload has no character name", async () => {
    initCharacterSelector();
    const payload = JSON.stringify({
      version: 1,
      character: {},
      inventory: {},
    });
    const input = setFile(fakeFile(payload));
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith(t("characters.unnamed"));
  });

  test("replace mode: replaces the active character's data without adding a new slot", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(VALID_PAYLOAD));
    input._mode = "replace";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(addCharacter).not.toHaveBeenCalled();
    expect(replaceActiveCharacter).toHaveBeenCalledWith(
      JSON.parse(VALID_PAYLOAD),
    );
  });

  test("a payload missing required fields shows an import error and touches nothing", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(JSON.stringify({ version: 1 })));
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining(t("characters.importErrorPrefix")),
      "error",
    );
    expect(addCharacter).not.toHaveBeenCalled();
    expect(replaceActiveCharacter).not.toHaveBeenCalled();
  });

  test("malformed JSON shows an import error", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile("not json"));
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining(t("characters.importErrorPrefix")),
      "error",
    );
  });

  test("always resets the input value and mode afterward, success or failure", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(VALID_PAYLOAD));
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(input.value).toBe("");
    expect(input._mode).toBeNull();
  });

  test("does nothing when the change event fires with no file selected", async () => {
    initCharacterSelector();
    const input = setFile(null);
    input._mode = "import";

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(addCharacter).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });
});
