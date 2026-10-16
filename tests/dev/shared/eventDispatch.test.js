import { clickStartedInside } from "dev/public/js/shared/eventDispatch.js";

function element() {
  return document.createElement("div");
}

describe("clickStartedInside", () => {
  test("is false when there is nothing to be inside of", () => {
    expect(clickStartedInside({ target: element() })).toBe(false);
    expect(clickStartedInside({ target: element() }, null, undefined)).toBe(
      false,
    );
  });

  test("uses the composed path, so a node replaced during the click still counts as inside", () => {
    const trigger = element();
    const orphan = element(); // no longer attached to trigger when a handler re-rendered it
    const event = {
      target: orphan,
      composedPath: () => [orphan, trigger, document],
    };
    expect(clickStartedInside(event, trigger)).toBe(true);
    expect(clickStartedInside(event, element())).toBe(false);
  });

  test("falls back to contains() without a composed path", () => {
    const trigger = element();
    const child = element();
    trigger.appendChild(child);
    expect(clickStartedInside({ target: child }, trigger)).toBe(true);
    expect(clickStartedInside({ target: element() }, trigger)).toBe(false);
  });
});
