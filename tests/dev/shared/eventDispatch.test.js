import {
  registerDelegatedHandlers,
  initGlobalDispatch,
  _resetForTests,
} from "dev/public/js/shared/eventDispatch.js";

// ─────────────────────────────────────────────────────────────────────────
// Setup notes
// ─────────────────────────────────────────────────────────────────────────
// initGlobalDispatch() attaches real document.addEventListener(...)
// listeners. jsdom gives one `document` per test FILE, not per test, so
// those listeners persist across every test below regardless of module
// state. Calling initGlobalDispatch() in every test would silently stack
// listeners and make later tests see handlers fire N times instead of
// once. Production only ever calls it once at bootstrap, so this suite
// mirrors that: attach once here, then rely on _resetForTests() in
// beforeEach to clear the *registries* between tests (the listeners stay
// attached but dispatch into empty registries, which is exactly the
// no-op path being tested).
//
// The one test that needs a second initGlobalDispatch() call (to prove
// double-init double-fires) is deliberately placed last in the file, since
// it permanently adds one extra listener for the remainder of the run.

beforeAll(() => {
  initGlobalDispatch();
});

beforeEach(() => {
  _resetForTests();
});

/**
 * Dispatches a real DOM event of `kind` on `document` and returns it, so
 * tests exercise the same document.addEventListener(...) path production
 * code uses, not a hand-rolled call into the module's internal dispatch.
 */
function fireDocumentEvent(kind) {
  const event = new Event(kind, { bubbles: true });
  document.dispatchEvent(event);
  return event;
}

// ─────────────────────────────────────────────────────────────────────────
// registerDelegatedHandlers
// ─────────────────────────────────────────────────────────────────────────

describe("registerDelegatedHandlers", () => {
  test("a handler registered for one kind is never invoked for another kind", () => {
    const clickHandler = jest.fn(() => true);
    registerDelegatedHandlers({ click: clickHandler });

    fireDocumentEvent("input");
    fireDocumentEvent("change");
    expect(clickHandler).not.toHaveBeenCalled();

    fireDocumentEvent("click");
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  test("a single call can register handlers for click, input, and change at once", () => {
    const click = jest.fn(() => true);
    const input = jest.fn(() => true);
    const change = jest.fn(() => true);
    registerDelegatedHandlers({ click, input, change });

    fireDocumentEvent("click");
    fireDocumentEvent("input");
    fireDocumentEvent("change");

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  test("omitting a kind registers nothing for it (no crash on dispatch)", () => {
    // Only a click handler provided — input/change registries stay empty.
    registerDelegatedHandlers({ click: jest.fn(() => true) });

    expect(() => fireDocumentEvent("input")).not.toThrow();
    expect(() => fireDocumentEvent("change")).not.toThrow();
  });

  test("calling with no argument at all is a safe no-op", () => {
    expect(() => registerDelegatedHandlers()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Dispatch order + chain-of-responsibility semantics
// ─────────────────────────────────────────────────────────────────────────

describe("dispatch order and chain-of-responsibility", () => {
  test("handlers are tried in registration order", () => {
    const callOrder = [];
    registerDelegatedHandlers({
      click: () => {
        callOrder.push("first");
        return false;
      },
    });
    registerDelegatedHandlers({
      click: () => {
        callOrder.push("second");
        return false;
      },
    });
    registerDelegatedHandlers({
      click: () => {
        callOrder.push("third");
        return false;
      },
    });

    fireDocumentEvent("click");
    expect(callOrder).toEqual(["first", "second", "third"]);
  });

  test("the first handler that returns true stops the chain — later handlers are not called", () => {
    const first = jest.fn(() => false);
    const second = jest.fn(() => true);
    const third = jest.fn(() => false);
    registerDelegatedHandlers({ click: first });
    registerDelegatedHandlers({ click: second });
    registerDelegatedHandlers({ click: third });

    fireDocumentEvent("click");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(third).not.toHaveBeenCalled();
  });

  test("a falsy (undefined) return is treated the same as false — the chain continues", () => {
    const first = jest.fn(() => undefined);
    const second = jest.fn(() => true);
    registerDelegatedHandlers({ click: first });
    registerDelegatedHandlers({ click: second });

    fireDocumentEvent("click");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("if every handler returns false, dispatch completes without throwing", () => {
    registerDelegatedHandlers({ click: () => false });
    registerDelegatedHandlers({ click: () => false });

    expect(() => fireDocumentEvent("click")).not.toThrow();
  });

  test("an event kind with no registered handlers at all no-ops safely", () => {
    // Nothing registered for any kind — dispatch must not throw against an
    // empty registry.
    expect(() => fireDocumentEvent("click")).not.toThrow();
    expect(() => fireDocumentEvent("input")).not.toThrow();
    expect(() => fireDocumentEvent("change")).not.toThrow();
  });

  test("each handler receives the originating event object", () => {
    const handler = jest.fn(() => true);
    registerDelegatedHandlers({ click: handler });

    const fired = fireDocumentEvent("click");

    expect(handler).toHaveBeenCalledWith(fired);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// _resetForTests
// ─────────────────────────────────────────────────────────────────────────

describe("_resetForTests", () => {
  test("clears all three registries so previously registered handlers no longer fire", () => {
    const click = jest.fn(() => true);
    const input = jest.fn(() => true);
    const change = jest.fn(() => true);
    registerDelegatedHandlers({ click, input, change });

    _resetForTests();

    expect(() => fireDocumentEvent("click")).not.toThrow();
    expect(() => fireDocumentEvent("input")).not.toThrow();
    expect(() => fireDocumentEvent("change")).not.toThrow();
    expect(click).not.toHaveBeenCalled();
    expect(input).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// initGlobalDispatch — MUST stay last in this file.
//
// This test intentionally calls initGlobalDispatch() a second time to
// document real (if surprising) behavior: the function has no guard
// against being invoked more than once, since production code only ever
// calls it once at bootstrap. It's placed last because the extra
// document-level listener it attaches is permanent for the rest of the
// jsdom document's lifetime (one document per test file) and would inflate
// call counts in every test below it.
// ─────────────────────────────────────────────────────────────────────────

describe("initGlobalDispatch (double-init — keep last in file)", () => {
  test("calling initGlobalDispatch() a second time attaches a second listener, so one event invokes each registered handler twice", () => {
    initGlobalDispatch();
    const handler = jest.fn(() => false);
    registerDelegatedHandlers({ click: handler });

    fireDocumentEvent("click");

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
