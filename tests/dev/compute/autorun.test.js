jest.mock("dev/public/js/ui.js", () => ({
  updateActualValues: jest.fn(),
}));

// autorun.js keeps its scheduler state (pending timers, the burst leading-edge flag, the
// sequence counter) as module-level variables — the scheduler is a singleton in the real app,
// so nothing resets it between ticks. A fresh module per test is what gives each test a clean
// slate instead of inheriting a still-pending timer or a leading-edge flag from the last one.
let updateActualValues;
let initAutoRun;
let triggerAutoRun;
let cancelPendingSave;
let AUTORUN_KIND;
let DEFAULT_AUTORUN_DELAY_MS;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.resetModules();
  ({ updateActualValues } = await import("dev/public/js/ui.js"));
  ({ DEFAULT_AUTORUN_DELAY_MS } =
    await import("dev/public/js/shared/constants.js"));
  ({ initAutoRun, triggerAutoRun, cancelPendingSave, AUTORUN_KIND } =
    await import("dev/public/js/compute/autorun.js"));
});

afterEach(() => {
  jest.useRealTimers();
});

// A run that never resolves on its own — advancing timers never settles it, so tests can
// assert "still in flight" states without racing a real promise.
function pendingRunEngine() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const fn = jest.fn(() => promise);
  fn.resolveWith = (value) => resolve(value);
  return fn;
}

describe("default (unclassified) trigger — unchanged from the single-debounce original", () => {
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
    await Promise.resolve();

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("calls updateActualValues a second time once the debounced engine run resolves", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun();
    expect(updateActualValues).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(updateActualValues).toHaveBeenCalledTimes(2);
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

  test("an unrecognised kind falls back to the same 300ms default, not a throw", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: "not-a-real-kind" });
    jest.advanceTimersByTime(299);
    expect(runEngineFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("is a safe no-op (no throw) when triggered before initAutoRun has ever been called", async () => {
    expect(() => triggerAutoRun()).not.toThrow();

    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });
});

describe("AUTORUN_KIND.IMMEDIATE", () => {
  test("runs on the next tick rather than waiting out a fixed delay", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    expect(runEngineFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    await Promise.resolve();

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("several same-tick triggers collapse into one run", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    jest.advanceTimersByTime(0);
    await Promise.resolve();

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });
});

describe("AUTORUN_KIND.BURST", () => {
  test("the first tap runs right away (leading edge)", () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.BURST });

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("taps within the burst window don't re-fire the leading edge", () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.BURST });
    jest.advanceTimersByTime(50);
    triggerAutoRun({ kind: AUTORUN_KIND.BURST });
    jest.advanceTimersByTime(50);
    triggerAutoRun({ kind: AUTORUN_KIND.BURST });

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("a trailing run fires once ~120ms after the last tap, picking up the final state", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.BURST });
    jest.advanceTimersByTime(50);
    triggerAutoRun({ kind: AUTORUN_KIND.BURST });

    jest.advanceTimersByTime(119);
    expect(runEngineFn).toHaveBeenCalledTimes(1); // only the leading run so far

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(runEngineFn).toHaveBeenCalledTimes(2);
  });

  test("a new burst after the trailing run fires its own leading edge", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.BURST });
    jest.advanceTimersByTime(120);
    await Promise.resolve();

    triggerAutoRun({ kind: AUTORUN_KIND.BURST });

    expect(runEngineFn).toHaveBeenCalledTimes(3);
  });
});

describe("AUTORUN_KIND.TYPING", () => {
  test("runs 180ms after the last keystroke", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    triggerAutoRun({ kind: AUTORUN_KIND.TYPING });
    jest.advanceTimersByTime(179);
    expect(runEngineFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });

  test("continuous typing still runs after the 600ms max wait, rather than stalling forever", async () => {
    const runEngineFn = jest.fn().mockResolvedValue();
    initAutoRun(runEngineFn);

    // A keystroke every 100ms, well inside the 180ms trailing window each time, so the
    // trailing timer alone would never fire — only the 7th keystroke (600ms after the first)
    // crosses the max wait and forces a run right then, mid-burst.
    for (let i = 0; i < 7; i++) {
      triggerAutoRun({ kind: AUTORUN_KIND.TYPING });
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    }

    expect(runEngineFn).toHaveBeenCalledTimes(1);
  });
});

describe("single-flight: never two engine runs in parallel", () => {
  test("a trigger while a run is in flight aborts it and starts a fresh one", async () => {
    const runEngineFn = jest.fn();
    let firstSignal;
    let secondSignal;
    runEngineFn
      .mockImplementationOnce(({ signal }) => {
        firstSignal = signal;
        return new Promise(() => {}); // never resolves on its own
      })
      .mockImplementationOnce(({ signal }) => {
        secondSignal = signal;
        return Promise.resolve();
      });
    initAutoRun(runEngineFn);

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    expect(runEngineFn).toHaveBeenCalledTimes(1);
    expect(firstSignal.aborted).toBe(false);

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(runEngineFn).toHaveBeenCalledTimes(2);
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal).not.toBe(firstSignal);
  });

  test("isCurrent() reports false for a superseded run once a newer one has started", async () => {
    const runEngineFn = jest.fn();
    let firstIsCurrent;
    runEngineFn
      .mockImplementationOnce(({ isCurrent }) => {
        firstIsCurrent = isCurrent;
        return new Promise(() => {});
      })
      .mockImplementationOnce(() => Promise.resolve());
    initAutoRun(runEngineFn);

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    expect(firstIsCurrent()).toBe(true);

    triggerAutoRun();
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(firstIsCurrent()).toBe(false);
  });
});

describe("save: decoupled from the engine run", () => {
  test("schedules onSave independently of the engine ever resolving", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    triggerAutoRun();
    jest.advanceTimersByTime(DEFAULT_AUTORUN_DELAY_MS - 1);
    expect(onSave).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("rapid edits coalesce into a single save, one trailing delay after the last one", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    triggerAutoRun();
    jest.advanceTimersByTime(DEFAULT_AUTORUN_DELAY_MS - 1);
    triggerAutoRun();
    jest.advanceTimersByTime(DEFAULT_AUTORUN_DELAY_MS - 1);
    expect(onSave).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // A localStorage write is cheap and synchronous, unlike the network-bound engine run, and a
  // backgrounded mobile tab can be killed by the OS before the pagehide/visibilitychange flush
  // ever runs — so the save must trail the same short delay as the engine run per trigger class,
  // not a longer fixed one, or an edit sits unprotected in memory for longer than it needs to.
  test("an immediate trigger saves with no delay, same as its engine run", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    jest.advanceTimersByTime(0);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("still saves when the engine run is rejected", async () => {
    const onSave = jest.fn();
    initAutoRun(jest.fn().mockRejectedValue(new Error("offline")), onSave);

    triggerAutoRun();
    jest.advanceTimersByTime(DEFAULT_AUTORUN_DELAY_MS);
    await Promise.resolve().catch(() => {});

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("flushes immediately on pagehide instead of waiting out the debounce", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    triggerAutoRun();
    expect(onSave).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("pagehide"));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("flushes when the page is hidden, not on other visibility changes", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);
    triggerAutoRun();

    jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onSave).not.toHaveBeenCalled();

    jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("a flush with nothing pending is a no-op", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    window.dispatchEvent(new Event("pagehide"));

    expect(onSave).not.toHaveBeenCalled();
  });

  test("cancelPendingSave stops a scheduled save from firing on pagehide", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    triggerAutoRun();
    cancelPendingSave();
    window.dispatchEvent(new Event("pagehide"));

    expect(onSave).not.toHaveBeenCalled();
  });

  test("cancelPendingSave with nothing scheduled is a no-op", () => {
    const onSave = jest.fn();
    initAutoRun(pendingRunEngine(), onSave);

    expect(() => cancelPendingSave()).not.toThrow();
    window.dispatchEvent(new Event("pagehide"));
    expect(onSave).not.toHaveBeenCalled();
  });
});
