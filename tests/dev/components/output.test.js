import { renderOutput } from "dev/public/js/components/output.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<pre id="out"></pre>`);
});

describe("renderOutput", () => {
  test("pretty-prints the given object as JSON into the #out element", () => {
    renderOutput({ a: 1, b: [2, 3] });
    expect(document.getElementById("out").textContent).toBe(
      JSON.stringify({ a: 1, b: [2, 3] }, null, 2),
    );
  });

  test("renders primitives and null the same way JSON.stringify would", () => {
    renderOutput(null);
    expect(document.getElementById("out").textContent).toBe("null");
  });
});
