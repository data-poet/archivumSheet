// Proves the ESM -> babel-jest -> jsdom pipeline works end to end; deleting this file
// must not affect the "engine" project.
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
