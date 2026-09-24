import { handleResumeAttributeInput } from "dev/public/js/engine/character/traits/resumeAttributeInput.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function elWithClass(tag, className, dataset = {}, value) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  if (value !== undefined) el.value = value;
  return el;
}

function fakeTarget() {
  return {
    setPrimaryModifier: jest.fn(),
    ensureSecondary: jest.fn(),
    setSecondary: jest.fn(),
  };
}

beforeEach(() => {
  resetDOM();
});

describe("handleResumeAttributeInput — resume-primary-mod-input", () => {
  test("writes a valid integer to the target", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "resume-primary-mod-input", { attr: "ST" }, "3") };

    expect(handleResumeAttributeInput(e, target)).toBe(true);
    expect(target.setPrimaryModifier).toHaveBeenCalledWith("ST", 3);
  });

  test("ignores partial entries ('-', '') without writing", () => {
    const target = fakeTarget();
    ["-", ""].forEach((raw) => {
      const e = { target: elWithClass("input", "resume-primary-mod-input", { attr: "ST" }, raw) };
      expect(handleResumeAttributeInput(e, target)).toBe(true);
    });
    expect(target.setPrimaryModifier).not.toHaveBeenCalled();
  });

  test("ignores a non-numeric value", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "resume-primary-mod-input", { attr: "ST" }, "abc") };

    expect(handleResumeAttributeInput(e, target)).toBe(true);
    expect(target.setPrimaryModifier).not.toHaveBeenCalled();
  });
});

describe("handleResumeAttributeInput — secondary-input", () => {
  test("ensures the secondary entry, then writes a clamped 'bought' value", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "secondary-input", { name: "Perception", field: "bought" }, "9") };

    handleResumeAttributeInput(e, target);

    expect(target.ensureSecondary).toHaveBeenCalledWith("Perception");
    expect(target.setSecondary).toHaveBeenCalledWith("Perception", "bought", 5);
  });

  test("Movement's 'bought' field is never written", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "secondary-input", { name: "Movement", field: "bought" }, "4") };

    handleResumeAttributeInput(e, target);

    expect(target.setSecondary).not.toHaveBeenCalled();
  });

  test("caps a vital stat's modifier at 0", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "secondary-input", { name: "HP", field: "modifier" }, "3") };

    handleResumeAttributeInput(e, target);

    expect(target.setSecondary).toHaveBeenCalledWith("HP", "modifier", 0);
  });

  test("rounds BasicSpeed's modifier to the nearest half-point", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "secondary-input", { name: "BasicSpeed", field: "modifier" }, "0.3") };

    handleResumeAttributeInput(e, target);

    expect(target.setSecondary).toHaveBeenCalledWith("BasicSpeed", "modifier", 0.5);
  });

  test("ignores a partial decimal entry without writing", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "secondary-input", { name: "HP", field: "modifier" }, "-0.") };

    handleResumeAttributeInput(e, target);

    expect(target.setSecondary).not.toHaveBeenCalled();
  });
});

describe("handleResumeAttributeInput — unrelated targets", () => {
  test("returns false and touches nothing", () => {
    const target = fakeTarget();
    const e = { target: elWithClass("input", "something-else") };

    expect(handleResumeAttributeInput(e, target)).toBe(false);
    expect(target.setPrimaryModifier).not.toHaveBeenCalled();
    expect(target.setSecondary).not.toHaveBeenCalled();
  });
});
