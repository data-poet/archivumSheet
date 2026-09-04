import {
  registerDelegatedHandlers,
  initGlobalDispatch,
  _resetForTests,
} from "dev/public/js/shared/eventDispatch.js";

// jsdom gives one `document` per test file, so listeners stack across tests; _resetForTests() clears the registries instead of re-calling initGlobalDispatch().
// The double-init test runs last — it permanently adds an extra listener for the rest of the file.

beforeAll(() => {
  initGlobalDispatch();
});

beforeEach(() => {
  _resetForTests();
});

function fireDocumentEvent(kind) {
  const event = new Event(kind, { bubbles: true });
  document.dispatchEvent(event);
  return event;
}

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
    registerDelegatedHandlers({ click: jest.fn(() => true) });

    expect(() => fireDocumentEvent("input")).not.toThrow();
    expect(() => fireDocumentEvent("change")).not.toThrow();
  });

  test("calling with no argument at all is a safe no-op", () => {
    expect(() => registerDelegatedHandlers()).not.toThrow();
  });
});

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

describe("initGlobalDispatch (double-init — keep last in file)", () => {
  test("calling initGlobalDispatch() a second time attaches a second listener, so one event invokes each registered handler twice", () => {
    initGlobalDispatch();
    const handler = jest.fn(() => false);
    registerDelegatedHandlers({ click: handler });

    fireDocumentEvent("click");

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
