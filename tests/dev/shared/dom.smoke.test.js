// Batch 0 smoke test. Purpose is narrow and deliberate: prove the pipeline
// (ESM import syntax -> babel-jest transform -> jsdom environment ->
// assertion) works end to end before any batch writes real coverage.
// Deleting this file must not affect the "engine" project (see acceptance
// criteria in frontend-testing-plan.md, Batch 0).
import { el } from "dev/public/js/shared/dom.js";
import { resetDOM, silenceConsoleWarn } from "tests/dev/helpers/domFixture.js";

describe("SMOKE — dev test pipeline", () => {
  beforeEach(() => {
    resetDOM();
  });

  test("el() finds an element that exists in the jsdom fixture", () => {
    const target = el("smoke-test-target");
    expect(target).not.toBeNull();
    expect(target.id).toBe("smoke-test-target");
  });

  test("el() returns null and warns for a missing id", () => {
    const warnSpy = silenceConsoleWarn();
    const result = el("does-not-exist");
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("does-not-exist"),
    );
    warnSpy.mockRestore();
  });

  test("localStorage is available via jsdom with no extra mock", () => {
    localStorage.setItem("archivum-smoke", "ok");
    expect(localStorage.getItem("archivum-smoke")).toBe("ok");
    localStorage.removeItem("archivum-smoke");
  });
});
