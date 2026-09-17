import {
  prefersReducedMotion,
  scrollToSection,
} from "dev/public/js/shared/motion.js";

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn((query) => ({ matches, media: query }));
}

describe("prefersReducedMotion", () => {
  afterEach(() => {
    delete window.matchMedia;
  });

  test("is false when the OS reduce-motion setting is off", () => {
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });

  test("is true when the OS reduce-motion setting is on", () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  test("is false when matchMedia isn't available at all", () => {
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("scrollToSection", () => {
  afterEach(() => {
    delete window.matchMedia;
  });

  test("scrolls smoothly by default", () => {
    mockMatchMedia(false);
    const element = { scrollIntoView: jest.fn() };
    scrollToSection(element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  test("jumps instantly when reduce-motion is on", () => {
    mockMatchMedia(true);
    const element = { scrollIntoView: jest.fn() };
    scrollToSection(element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });
});
