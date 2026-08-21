jest.mock("dev/public/js/ui.js", () => ({
  updateActualValues: jest.fn(),
}));

import { updateActualValues } from "dev/public/js/ui.js";
import { initAutoRun, triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("triggerAutoRun", () => {
  test("calls updateActualValues immediately, synchronously, before any debounce", () => {
    initAutoRun(jest.fn().mockResolvedValue());
    triggerAutoRun();
    expect(updateActualValues).toHaveBeenCalledTimes(1);
  });

  test("debounces: rapid successive calls only run the engine once, 300ms after the last one", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun();
    jest.advanceTimersByTime(100);
    triggerAutoRun();
    jest.advanceTimersByTime(100);
    triggerAutoRun();
    jest.advanceTimersByTime(299);
    expect(runEngineFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve(); // flush the .then() microtask

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("calls updateActualValues a second time once the debounced engine run resolves", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun();
    expect(updateActualValues).toHaveBeenCalledTimes(1); // the immediate call

    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(updateActualValues).toHaveBeenCalledTimes(2); // + post-run call
  });

  test("two full trigger/resolve cycles invoke the injected engine twice", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(runEngineFn).toHaveBeenCalledTimes(2);
  });

  test("is a safe no-op (no throw) when triggered before initAutoRun has ever been called", async () => {
    // _runEngine is a module-level singleton set only by initAutoRun, so a
    // fresh module instance is needed to genuinely observe the
    // never-initialized state — other tests in this file call initAutoRun
    // first and would otherwise leave it wired up.
    jest.resetModules();
    const freshAutorun = await import("dev/public/js/compute/autorun.js");

    expect(() => freshAutorun.triggerAutoRun()).not.toThrow();

    jest.advanceTimersByTime(300);
    await Promise.resolve();
    // Nothing to assert on the engine call (there's no fn to spy on before
    // initAutoRun) — the assertion is simply that none of this throws.
  });
});
