jest.mock("dev/public/js/store/characters.js", () => ({
  listCharacters: jest.fn(),
  listCharactersGrouped: jest.fn(),
  getActiveCharacterId: jest.fn(),
  loadCharacter: jest.fn(),
  addCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  saveActiveCharacter: jest.fn(),
  replaceActiveCharacter: jest.fn(),
  getActiveKind: jest.fn(() => "character"),
  setActiveKind: jest.fn(),
}));
jest.mock("dev/public/js/components/entryKind.js", () => ({
  renderEntryKind: jest.fn(),
  warnAllyOnlyContent: jest.fn(),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  exportSheet: jest.fn(),
  exportAllySheet: jest.fn(),
  importSheet: jest.fn(),
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/components/dialog.js", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("dev/public/js/store/catalogs.js", () => ({
  reloadCatalogs: jest.fn(() => Promise.resolve()),
}));

import {
  listCharacters,
  listCharactersGrouped,
  getActiveCharacterId,
  loadCharacter,
  addCharacter,
  removeCharacter,
  saveActiveCharacter,
  replaceActiveCharacter,
  getActiveKind,
} from "dev/public/js/store/characters.js";
import {
  exportSheet,
  exportAllySheet,
  showToast,
} from "dev/public/js/store/persistence.js";
import { showConfirm } from "dev/public/js/components/dialog.js";
import { renderEntryKind } from "dev/public/js/components/entryKind.js";
import { reloadCatalogs } from "dev/public/js/store/catalogs.js";
import {
  updateSelectorButton,
  openSelector,
  closeSelector,
  toggleSelector,
  renderPopover,
  initCharacterSelector,
} from "dev/public/js/components/characterSelector.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { ENTRY_KINDS } from "dev/public/js/shared/constants.js";
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
  listCharactersGrouped.mockReturnValue(CHARS);
  getActiveCharacterId.mockReturnValue("c1");
  // jest.clearAllMocks() (above) resets call history but not a prior mockReturnValue —
  // reassert the default here so no earlier test's override leaks into this one.
  getActiveKind.mockReturnValue(ENTRY_KINDS.CHARACTER);
});

describe("updateSelectorButton", () => {
  test("shows the active character's name, which wins over its race", () => {
    updateSelectorButton();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.querySelector(".char-selector-btn-name").textContent).toBe(
      "Aria",
    );
  });

  test("falls back to the 'unnamed' label when both name and race are blank", () => {
    getActiveCharacterId.mockReturnValue("c2");
    updateSelectorButton();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.querySelector(".char-selector-btn-name").textContent).toBe(
      t("characters.unnamed"),
    );
  });

  test("falls back to the sub-race when the name is blank but a race is set", () => {
    listCharacters.mockReturnValue([
      { id: "c3", name: "", race: "Elemental de Terra" },
    ]);
    getActiveCharacterId.mockReturnValue("c3");
    updateSelectorButton();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.querySelector(".char-selector-btn-name").textContent).toBe(
      "Elemental de Terra",
    );
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
    expect(items[0].getAttribute("aria-current")).toBe("true");
    expect(items[1].hasAttribute("aria-current")).toBe(false);
    expect(items[0].querySelector(".char-selector-radio").textContent).toBe(
      "⦿",
    );
    expect(items[1].classList.contains("is-active")).toBe(false);
    expect(items[1].querySelector(".char-selector-radio").textContent).toBe(
      "○",
    );
  });

  test("falls back to 'unnamed' for a character with neither name nor race", () => {
    renderPopover();
    const secondItem = document.querySelectorAll(".char-selector-item")[1];
    expect(
      secondItem.querySelector(".char-selector-item-name").textContent,
    ).toBe(t("characters.unnamed"));
  });

  test("falls back to the sub-race when the name is blank but a race is set", () => {
    listCharactersGrouped.mockReturnValue([
      { id: "c3", name: "", race: "Elemental de Terra" },
    ]);
    renderPopover();
    const item = document.querySelector(".char-selector-item");
    expect(item.querySelector(".char-selector-item-name").textContent).toBe(
      "Elemental de Terra",
    );
  });

  test("marks an ally-kind entry with a compact single-letter badge, full word in the tooltip", () => {
    listCharactersGrouped.mockReturnValue([
      { id: "c3", name: "Bran", kind: ENTRY_KINDS.ALLY },
    ]);
    renderPopover();
    const badge = document.querySelector(".char-selector-item-kind");
    expect(badge.textContent).toBe(t("characters.kindBadge"));
    expect(badge.getAttribute("title")).toBe(t("characters.kindBadgeTitle"));
  });

  test("omits the kind badge for a plain character", () => {
    renderPopover();
    expect(document.querySelector(".char-selector-item-kind")).toBeNull();
  });

  test("renders all six action items with localized labels", () => {
    renderPopover();
    const actions = document.querySelectorAll(".char-selector-action-item");
    expect(actions).toHaveLength(6);
    const byAction = Object.fromEntries(
      Array.from(actions).map((a) => [a.dataset.action, a.textContent]),
    );
    expect(byAction["add-char"]).toContain(t("characters.add"));
    expect(byAction["add-ally"]).toContain(t("characters.addAlly"));
    expect(byAction["remove-char"]).toContain(t("characters.remove"));
    expect(byAction["import-char"]).toContain(t("app.import"));
    expect(byAction["export-char"]).toContain(t("app.export"));
    expect(byAction["replace-char"]).toContain(t("characters.replace"));
  });

  test("does not throw when the popover isn't in the DOM", () => {
    document.getElementById("char-selector-popover").remove();
    expect(() => renderPopover()).not.toThrow();
  });

  test("every row is a real button, so the whole popover is keyboard-operable", () => {
    renderPopover();
    const rows = document.querySelectorAll(
      ".char-selector-item, .char-selector-action-item",
    );
    expect(rows).toHaveLength(8);
    rows.forEach((row) => {
      expect(row.tagName).toBe("BUTTON");
      expect(row.type).toBe("button");
    });
  });

  test("claims no listbox semantics it can't honour", () => {
    renderPopover();
    const popover = document.getElementById("char-selector-popover");
    expect(popover.querySelector('[role="listbox"]')).toBeNull();
    expect(popover.querySelector('[role="option"]')).toBeNull();
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

  test("openSelector moves focus into the popover and marks the trigger expanded", () => {
    openSelector();
    expect(
      document
        .getElementById("char-selector-btn")
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(document.activeElement).toBe(
      document.querySelectorAll(".char-selector-item")[0],
    );
  });

  test("closeSelector resets aria-expanded, and only restores focus when asked", () => {
    openSelector();
    closeSelector();
    const btn = document.getElementById("char-selector-btn");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).not.toBe(btn);

    openSelector();
    closeSelector({ restoreFocus: true });
    expect(document.activeElement).toBe(btn);
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

  test("Escape closes the popover and hands focus back to the trigger", () => {
    initCharacterSelector();
    document.getElementById("char-selector-btn").click();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
    expect(document.activeElement).toBe(
      document.getElementById("char-selector-btn"),
    );
  });

  test("Escape is ignored while the popover is already closed", () => {
    initCharacterSelector();
    const btn = document.getElementById("char-selector-btn");
    btn.blur();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(document.activeElement).not.toBe(btn);
  });

  test("an outside click closes it without yanking focus away from whatever was clicked", () => {
    initCharacterSelector();
    document.getElementById("char-selector-btn").click();

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.activeElement).not.toBe(
      document.getElementById("char-selector-btn"),
    );
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
  test("selecting the already-active character just closes the popover", async () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(saveActiveCharacter).not.toHaveBeenCalled();
    expect(loadCharacter).not.toHaveBeenCalled();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  test("selecting a different character saves the current one, loads the new one, and closes", async () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(saveActiveCharacter).toHaveBeenCalledTimes(1);
    expect(loadCharacter).toHaveBeenCalledWith("c2");
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  // The two entries share a kind (both default to "character" here), so no catalog
  // work is needed — this is the common case the no-reload rewrite optimizes for.
  test("does not reload catalogs when the target character's kind matches the active one", async () => {
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c2"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(reloadCatalogs).not.toHaveBeenCalled();
  });

  test("reloads catalogs for the new audience before loading the character, when kind differs", async () => {
    listCharacters.mockReturnValue([
      ...CHARS,
      { id: "c3", name: "Bran", race: "", kind: ENTRY_KINDS.ALLY },
    ]);
    listCharactersGrouped.mockReturnValue(listCharacters());
    initCharacterSelector();
    openSelector();

    document
      .querySelector('.char-selector-item[data-id="c3"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(reloadCatalogs).toHaveBeenCalledWith("npc");
    expect(loadCharacter).toHaveBeenCalledWith("c3");
  });
});

describe("initCharacterSelector — add-char", () => {
  let promptSpy;
  beforeEach(() => {
    promptSpy = jest.spyOn(window, "prompt");
  });
  afterEach(() => promptSpy.mockRestore());

  test("cancelling the prompt (returns null) does not add a character", async () => {
    promptSpy.mockReturnValue(null);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).not.toHaveBeenCalled();
  });

  test("adds a character with the trimmed prompt value", async () => {
    promptSpy.mockReturnValue("  Novo Herói  ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith("Novo Herói");
  });

  // Kept blank rather than defaulted, so _displayName()'s name → race → "unnamed" fallback
  // has a real blank to fall through to once a race is picked.
  test("keeps the name blank when the prompt is submitted blank", async () => {
    promptSpy.mockReturnValue("   ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith("");
  });

  test("does not reload catalogs — the active entry is already a character", async () => {
    promptSpy.mockReturnValue("Novo Herói");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(reloadCatalogs).not.toHaveBeenCalled();
  });
});

describe("initCharacterSelector — add-ally", () => {
  let promptSpy;
  beforeEach(() => {
    promptSpy = jest.spyOn(window, "prompt");
  });
  afterEach(() => promptSpy.mockRestore());

  test("cancelling the prompt (returns null) does not add an ally draft", async () => {
    promptSpy.mockReturnValue(null);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-ally"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).not.toHaveBeenCalled();
  });

  test("adds a draft with kind 'ally' and the trimmed prompt value", async () => {
    promptSpy.mockReturnValue("  Bran, o Batedor  ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-ally"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith(
      "Bran, o Batedor",
      ENTRY_KINDS.ALLY,
    );
  });

  // This is the case the sub-race fallback (_displayName) exists for: a hand-made ally left
  // unnamed shows its species/sub-race in the selector once one is picked, not a generic
  // "Novo Aliado" forever.
  test("keeps the name blank when the prompt is submitted blank", async () => {
    promptSpy.mockReturnValue("   ");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-ally"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(addCharacter).toHaveBeenCalledWith("", ENTRY_KINDS.ALLY);
  });

  // The active entry defaults to "character" in this suite, so drafting an ally always
  // crosses a kind boundary and must re-filter races/advantages/disadvantages for it.
  test("reloads catalogs for the ally audience before adding the draft", async () => {
    promptSpy.mockReturnValue("Bran");
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="add-ally"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();

    expect(reloadCatalogs).toHaveBeenCalledWith("npc");
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
    expect(exportAllySheet).not.toHaveBeenCalled();
    expect(
      document
        .getElementById("char-selector-popover")
        .classList.contains("is-open"),
    ).toBe(false);
  });

  // An ally has only one export action — it exports as an ally file, never the plain shape
  // (which would drop the `portrait` marker isAllyFile() needs to recognize it on re-import).
  test("export-char calls exportAllySheet instead, when the active character is an ally", () => {
    getActiveKind.mockReturnValue(ENTRY_KINDS.ALLY);
    initCharacterSelector();
    openSelector();

    document
      .querySelector('[data-action="export-char"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(exportAllySheet).toHaveBeenCalledTimes(1);
    expect(exportSheet).not.toHaveBeenCalled();
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

    expect(addCharacter).toHaveBeenCalledWith("Importado", "character");
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

    expect(addCharacter).toHaveBeenCalledWith(
      t("characters.unnamed"),
      "character",
    );
  });

  // An imported character lands in a slot whose kind may differ from the one on screen —
  // import mode always repaints the entry-kind control (and reloads catalogs first, if the
  // kind actually changed) instead of reloading the whole page.
  test("import mode refreshes the entry-kind control in place", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(VALID_PAYLOAD));
    input._mode = "import";
    renderEntryKind.mockClear();

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(renderEntryKind).toHaveBeenCalled();
    expect(addCharacter).toHaveBeenCalled();
    expect(replaceActiveCharacter).toHaveBeenCalled();
  });

  test("reloads catalogs when the imported file's kind differs from the active one", async () => {
    initCharacterSelector();
    const input = setFile(
      fakeFile(
        JSON.stringify({
          version: 1,
          character: {},
          inventory: {},
          pc: { character_name: "Bran" },
          portrait: "/images/allies/ally-0001-bran.png",
        }),
      ),
    );
    input._mode = "import";
    reloadCatalogs.mockClear();

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(reloadCatalogs).toHaveBeenCalledWith("npc");
  });

  test("replace mode refreshes it too", async () => {
    initCharacterSelector();
    const input = setFile(fakeFile(VALID_PAYLOAD));
    input._mode = "replace";
    renderEntryKind.mockClear();

    input.dispatchEvent(new Event("change"));
    await flush();

    expect(renderEntryKind).toHaveBeenCalled();
  });

  // The kind is only a label — no sheet data differs either way — but getting it wrong would
  // put an ally badge on someone's character, so the detection is a positive test on `portrait`
  // and everything else falls through to "character".
  describe("recognising an ally file on import", () => {
    async function importPayload(payload) {
      initCharacterSelector();
      const input = setFile(fakeFile(JSON.stringify(payload)));
      input._mode = "import";
      addCharacter.mockClear();

      input.dispatchEvent(new Event("change"));
      await flush();
    }

    const BASE = {
      version: 1,
      character: {},
      inventory: {},
      pc: { character_name: "X" },
    };

    test("an ally export reopens as a draft, so edit → re-export needs no manual step", async () => {
      await importPayload({
        ...BASE,
        portrait: "/images/allies/ally-0001-bran.png",
      });

      expect(addCharacter).toHaveBeenCalledWith("X", "ally");
    });

    test("a character export stays a character", async () => {
      await importPayload({ ...BASE, exportedAt: "2026-09-18T00:00:00.000Z" });

      expect(addCharacter).toHaveBeenCalledWith("X", "character");
    });

    // A file predating either marker must not be guessed at.
    test.each([
      ["neither marker", {}],
      ["an empty portrait", { portrait: "" }],
      ["a non-string portrait", { portrait: true }],
      ["a null portrait", { portrait: null }],
    ])("%s stays a character", async (_label, extra) => {
      await importPayload({ ...BASE, ...extra });

      expect(addCharacter).toHaveBeenCalledWith("X", "character");
    });
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
