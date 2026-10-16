const {
  slugify,
  deriveKeys,
  recordSpans,
  rewriteCsv,
} = require("scripts/generateKeys.js");

describe("slugify", () => {
  test("lowercases, strips accents and collapses punctuation", () => {
    expect(slugify("TOLERÂNCIA À FERIMENTOS | HOMOGÊNEO")).toBe(
      "tolerancia-a-ferimentos-homogeneo",
    );
    expect(slugify("  Obra-Prima ")).toBe("obra-prima");
    expect(slugify(undefined)).toBe("");
  });
});

describe("deriveKeys", () => {
  test("uses name plus the always columns", () => {
    const rows = [
      { n: "Espada", t: "Comum" },
      { n: "Espada", t: "Boa" },
    ];
    expect(deriveKeys(rows, { name: "n", always: ["t"] }).keys).toEqual([
      "espada-comum",
      "espada-boa",
    ]);
  });

  test("widens only the colliding rows with a tie-breaker", () => {
    const rows = [
      { n: "Pike", t: "Comum", k: "Lanças" },
      { n: "Pike", t: "Comum", k: "Martelos" },
      { n: "Adaga", t: "Comum", k: "Facas" },
    ];
    expect(
      deriveKeys(rows, { name: "n", always: ["t"], also: ["k"] }).keys,
    ).toEqual(["pike-comum-lancas", "pike-comum-martelos", "adaga-comum"]);
  });

  test("numbers rows that still collide and reports them", () => {
    const rows = [{ n: "X" }, { n: "X" }, { n: "X" }];
    const { keys, numbered } = deriveKeys(rows, { name: "n" });
    expect(keys).toEqual(["x", "x-2", "x-3"]);
    expect(numbered).toEqual([1, 2]);
  });

  test("a part that repeats the name replaces it", () => {
    const rows = [{ n: "Anão", s: "Anão da Montanha" }];
    expect(deriveKeys(rows, { name: "n", always: ["s"] }).keys).toEqual([
      "anao-da-montanha",
    ]);
  });
});

describe("rewriteCsv", () => {
  const text = 'id,name\nA-1,"two\nlines, with comma"\r\nA-2,plain\n';

  test("records spans respect quoted line breaks", () => {
    expect(recordSpans(text)).toHaveLength(3);
  });

  test("adds the column right after the id and leaves everything else byte-identical", () => {
    expect(rewriteCsv(text, "key", ["one", "two"], "add")).toBe(
      'id,key,name\nA-1,one,"two\nlines, with comma"\r\nA-2,two,plain\n',
    );
  });

  test("fill mode writes only into empty key cells", () => {
    const withKeys = "id,key,name\nA-1,kept,x\nA-2,,y\n";
    expect(rewriteCsv(withKeys, "key", ["new1", "new2"], "fill")).toBe(
      "id,key,name\nA-1,kept,x\nA-2,new2,y\n",
    );
  });
});
