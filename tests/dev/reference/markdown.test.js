import {
  configureMarked,
  glossaryExtension,
  glossaryPopoverId,
  mountGlossaryPopovers,
} from "dev/public/js/reference/markdown.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

describe("glossaryExtension", () => {
  test("tokenizes [[KEY]] and [[KEY|text]] at the start of the source only", () => {
    expect(glossaryExtension.tokenizer("[[PV]] restantes")).toEqual({
      type: "glossary",
      raw: "[[PV]]",
      key: "PV",
      text: "PV",
    });
    expect(glossaryExtension.tokenizer("[[HT|Vitalidade]]")).toMatchObject({
      key: "HT",
      text: "Vitalidade",
    });
    expect(glossaryExtension.tokenizer("perde [[PV]]")).toBeUndefined();
  });

  test("start() points marked at the next [[ or nowhere", () => {
    expect(glossaryExtension.start("perde [[PV]]")).toBe(6);
    expect(glossaryExtension.start("sem termos")).toBeUndefined();
  });

  test("renders known keys as a popover trigger and unknown keys as plain text", () => {
    expect(glossaryExtension.renderer({ key: "PV", text: "PV" })).toBe(
      `<button type="button" class="glossary-term" popovertarget="glossary-pv">PV</button>`,
    );
    expect(glossaryExtension.renderer({ key: "XYZ", text: "XYZ" })).toBe("XYZ");
  });
});

describe("glossaryPopoverId", () => {
  test("slugs accents and spaces into a valid id", () => {
    expect(glossaryPopoverId("Ação Rápida")).toBe("glossary-acao-rapida");
  });
});

describe("mountGlossaryPopovers", () => {
  beforeEach(() => resetDOM());

  test("mounts one popover per glossary term, once", () => {
    mountGlossaryPopovers();
    mountGlossaryPopovers();

    const popovers = document.querySelectorAll(".glossary-popover[popover]");
    expect(popovers).toHaveLength(Object.keys(LABELS.glossary).length);
    const pv = document.getElementById("glossary-pv");
    expect(pv.textContent).toContain(LABELS.glossary.PV.term);
    expect(pv.textContent).toContain(LABELS.glossary.PV.definition);
  });
});

describe("configureMarked", () => {
  afterEach(() => delete window.markedAlert);

  test("registers pt-BR callout variants, including the house rule, and the glossary extension", () => {
    const marked = { use: jest.fn() };
    window.markedAlert = jest.fn((options) => ({ alert: options }));
    configureMarked(marked);

    const { variants } = window.markedAlert.mock.calls[0][0];
    expect(variants.find((v) => v.type === "house").title).toBe(
      LABELS.reference.alerts.house,
    );
    expect(variants.find((v) => v.type === "note").title).toBe("Nota");
    expect(variants.find((v) => v.type === "example").title).toBe("Exemplo");
    expect(marked.use).toHaveBeenCalledWith({
      extensions: [glossaryExtension],
    });
  });

  test("still registers the glossary when the marked-alert CDN script is missing", () => {
    const marked = { use: jest.fn() };
    configureMarked(marked);

    expect(marked.use).toHaveBeenCalledTimes(1);
    expect(marked.use).toHaveBeenCalledWith({
      extensions: [glossaryExtension],
    });
  });
});
