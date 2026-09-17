jest.mock("dev/public/js/shared/openState.js", () => ({
  snapshotAll: jest.fn(() => "SNAPSHOT"),
  restoreAll: jest.fn(),
}));

import { snapshotAll, restoreAll } from "dev/public/js/shared/openState.js";
import {
  createListRenderer,
  createDeferredRender,
} from "dev/public/js/engine/inventory/shared/renderScheduling.js";
import { state } from "dev/public/js/state.js";

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("createListRenderer", () => {
  test("snapshots open state immediately but defers the render by one animation frame", () => {
    const render = jest.fn();
    const renderLists = createListRenderer(render);

    renderLists();

    expect(snapshotAll).toHaveBeenCalledTimes(1);
    expect(render).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();

    expect(render).toHaveBeenCalledTimes(1);
  });

  test("calls every render function in order with (selected, data, sheet)", () => {
    const calls = [];
    const first = jest.fn(() => calls.push("first"));
    const second = jest.fn(() => calls.push("second"));
    const renderLists = createListRenderer(first, second);

    renderLists("SHEET");
    jest.advanceTimersToNextFrame();

    expect(calls).toEqual(["first", "second"]);
    expect(first).toHaveBeenCalledWith(state.selected, state.data, "SHEET");
    expect(second).toHaveBeenCalledWith(state.selected, state.data, "SHEET");
  });

  test("restores the snapshot in the same frame as the render, never a later one", () => {
    const render = jest.fn(() => {
      // restoreAll must not have run yet when the render itself executes
      expect(restoreAll).not.toHaveBeenCalled();
    });
    const renderLists = createListRenderer(render);

    renderLists();
    jest.advanceTimersToNextFrame();

    expect(restoreAll).toHaveBeenCalledWith("SNAPSHOT");
  });

  test("passes sheet through as undefined when called with no argument", () => {
    const render = jest.fn();
    createListRenderer(render)();
    jest.advanceTimersToNextFrame();

    expect(render).toHaveBeenCalledWith(state.selected, state.data, undefined);
  });
});

describe("createDeferredRender", () => {
  test("does not render until the delay elapses", () => {
    const render = jest.fn();
    const deferRender = createDeferredRender(render);

    deferRender();
    jest.advanceTimersByTime(299);
    expect(render).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  test("collapses rapid calls into a single trailing render", () => {
    const render = jest.fn();
    const deferRender = createDeferredRender(render);

    deferRender();
    jest.advanceTimersByTime(100);
    deferRender();
    jest.advanceTimersByTime(100);
    deferRender();
    jest.advanceTimersByTime(300);

    expect(render).toHaveBeenCalledTimes(1);
  });

  test("honours a custom delay", () => {
    const render = jest.fn();
    const deferRender = createDeferredRender(render, 50);

    deferRender();
    jest.advanceTimersByTime(50);

    expect(render).toHaveBeenCalledTimes(1);
  });

  test("gives each instance its own timer, so one does not cancel the other", () => {
    const first = jest.fn();
    const second = jest.fn();
    const deferFirst = createDeferredRender(first);
    const deferSecond = createDeferredRender(second);

    deferFirst();
    deferSecond();
    jest.advanceTimersByTime(300);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
