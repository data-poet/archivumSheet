import { bindStepperButtons } from "dev/public/js/shared/stepper.js";

// jsdom has no PointerEvent constructor, but the handlers only switch on event.type and
// e.target — a plain Event with that type dispatches through them identically to a real one.
function pointerEvent(type) {
  return new Event(type, { bubbles: true, cancelable: true });
}

function buildStepper({ step, min, max, value = "0" } = {}) {
  document.body.innerHTML = `
    <div class="num-stepper">
      <input
        type="text"
        value="${value}"
        ${step !== undefined ? `data-step="${step}"` : ""}
        ${min !== undefined ? `data-min="${min}"` : ""}
        ${max !== undefined ? `data-max="${max}"` : ""}
      />
      <div class="stepper-btns">
        <button class="stepper-btn stepper-inc" aria-label="+">+</button>
        <button class="stepper-btn stepper-dec" aria-label="−">−</button>
      </div>
    </div>
  `;
  return {
    input: document.querySelector("input"),
    inc: document.querySelector(".stepper-inc"),
    dec: document.querySelector(".stepper-dec"),
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
  bindStepperButtons();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("a plain tap (click, no hold)", () => {
  test("increments by the default step of 1", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("1");
  });

  test("decrements by the default step of 1", () => {
    const { input, dec } = buildStepper({ value: "5" });
    dec.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("4");
  });

  test("honours a custom data-step", () => {
    const { input, inc } = buildStepper({ step: 5 });
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("5");
  });

  test("clamps at data-min / data-max", () => {
    const { input, dec } = buildStepper({ value: "0", min: 0 });
    dec.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("0");

    const { input: input2, inc } = buildStepper({ value: "10", max: 10 });
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input2.value).toBe("10");
  });

  test("dispatches a bubbling input event so autorun picks it up", () => {
    const { inc } = buildStepper();
    const spy = jest.fn();
    document.addEventListener("input", spy);

    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("a click with no preceding pointerdown (e.g. a screen-reader activation) still applies one step", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("1");
  });
});

describe("holding a stepper button down", () => {
  test("does nothing before the 400ms hold delay elapses", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));

    jest.advanceTimersByTime(399);

    expect(input.value).toBe("0");
  });

  test("applies the first repeat once the hold delay elapses, then repeats every 80ms", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));

    jest.advanceTimersByTime(400);
    expect(input.value).toBe("1");

    jest.advanceTimersByTime(80);
    expect(input.value).toBe("2");

    jest.advanceTimersByTime(80);
    expect(input.value).toBe("3");
  });

  test("stops repeating on pointerup", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400 + 80);
    expect(input.value).toBe("2");

    inc.dispatchEvent(pointerEvent("pointerup"));
    jest.advanceTimersByTime(400);

    expect(input.value).toBe("2");
  });

  test("the click the browser fires on release after a hold does not apply an extra step", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400); // crosses into "held" territory
    expect(input.value).toBe("1");

    inc.dispatchEvent(pointerEvent("pointerup"));
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(input.value).toBe("1");
  });

  test("the next plain tap after a hold applies its own step normally", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400);
    inc.dispatchEvent(pointerEvent("pointerup"));
    inc.dispatchEvent(new MouseEvent("click", { bubbles: true })); // consumed, no extra step
    expect(input.value).toBe("1");

    inc.dispatchEvent(new MouseEvent("click", { bubbles: true })); // a fresh, separate tap
    expect(input.value).toBe("2");
  });

  test("sliding off the button (pointerleave) before the delay cancels the hold", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(200);
    inc.dispatchEvent(pointerEvent("pointerleave"));

    jest.advanceTimersByTime(400);

    expect(input.value).toBe("0");
  });

  test("pointercancel (e.g. a scroll gesture taking over) also stops the hold", () => {
    const { input, inc } = buildStepper();
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400 + 80);
    expect(input.value).toBe("2");

    inc.dispatchEvent(pointerEvent("pointercancel"));
    jest.advanceTimersByTime(400);

    expect(input.value).toBe("2");
  });

  test("respects clamping while repeating", () => {
    const { input, inc } = buildStepper({ value: "9", max: 10 });
    inc.dispatchEvent(pointerEvent("pointerdown"));

    jest.advanceTimersByTime(400); // 9 -> 10
    jest.advanceTimersByTime(80); // clamped at 10

    expect(input.value).toBe("10");
  });

  test("starting a new hold on a different button works independently", () => {
    const { input, inc, dec } = buildStepper({ value: "5" });
    inc.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400);
    expect(input.value).toBe("6");
    inc.dispatchEvent(pointerEvent("pointerup"));

    dec.dispatchEvent(pointerEvent("pointerdown"));
    jest.advanceTimersByTime(400);
    expect(input.value).toBe("5");
  });
});
