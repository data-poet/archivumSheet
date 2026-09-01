import { initNav } from "dev/public/js/components/nav.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// jsdom implements neither scrollIntoView nor IntersectionObserver.
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    MockIntersectionObserver.instances.push(this);
  }
  observe(el) {
    this.observed.push(el);
  }
  disconnect() {}
}
MockIntersectionObserver.instances = [];

function navDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="sidebar"></nav><nav id="bottomnav"></nav>`,
  );
}

function sectionDOM(...ids) {
  ids.forEach((id) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<section id="${id}" class="l-section"></section>`,
    );
  });
}

beforeEach(() => {
  resetDOM();
  navDOM();
  Element.prototype.scrollIntoView = jest.fn();
  MockIntersectionObserver.instances = [];
  global.IntersectionObserver = MockIntersectionObserver;
});

describe("initNav — building the nav bars", () => {
  test("renders one sidebar link per LABELS.nav entry, first one active, with icon/label/data-section", () => {
    initNav();

    const links = document.querySelectorAll("#sidebar .sidebar-link");
    expect(links).toHaveLength(LABELS.nav.length);
    expect(links[0].classList.contains("is-active")).toBe(true);
    expect(links[1].classList.contains("is-active")).toBe(false);

    const first = LABELS.nav[0];
    expect(links[0].dataset.section).toBe(first.key);
    expect(links[0].getAttribute("href")).toBe(`#${first.key}`);
    expect(links[0].querySelector(".sidebar-icon").textContent).toBe(
      first.icon,
    );
    expect(links[0].querySelector(".sidebar-label").textContent).toBe(
      first.label,
    );
  });

  test("renders the same items into the bottomnav, first one active", () => {
    initNav();

    const links = document.querySelectorAll("#bottomnav .bottomnav-link");
    expect(links).toHaveLength(LABELS.nav.length);
    expect(links[0].classList.contains("is-active")).toBe(true);
    expect(links[0].dataset.section).toBe(LABELS.nav[0].key);
  });

  test("does not throw when #sidebar or #bottomnav is missing", () => {
    resetDOM(); // neither container present
    expect(() => initNav()).not.toThrow();
  });

  test("re-running initNav doesn't duplicate the sidebar <ul>", () => {
    initNav();
    initNav();
    expect(document.querySelectorAll("#sidebar .sidebar-nav")).toHaveLength(1);
    expect(document.querySelectorAll("#sidebar .sidebar-link")).toHaveLength(
      LABELS.nav.length,
    );
  });
});

describe("initNav — click highlighting", () => {
  test("clicking a sidebar link prevents default, scrolls to the target section, and marks it active", () => {
    initNav();
    sectionDOM(LABELS.nav[1].key);

    const link = document.querySelectorAll("#sidebar .sidebar-link")[1];
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(link.classList.contains("is-active")).toBe(true);
    expect(
      document
        .querySelectorAll("#sidebar .sidebar-link")[0]
        .classList.contains("is-active"),
    ).toBe(false);
  });

  test("highlighting a sidebar link also syncs the matching bottomnav link", () => {
    initNav();
    sectionDOM(LABELS.nav[2].key);

    document
      .querySelectorAll("#sidebar .sidebar-link")[2]
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    const matchingBottomLink = document.querySelector(
      `#bottomnav .bottomnav-link[data-section="${LABELS.nav[2].key}"]`,
    );
    expect(matchingBottomLink.classList.contains("is-active")).toBe(true);
  });

  test("does not throw when the clicked link's target section isn't in the DOM", () => {
    initNav(); // no matching sectionDOM() call
    const link = document.querySelectorAll("#sidebar .sidebar-link")[1];
    expect(() =>
      link.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    ).not.toThrow();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  test("a click outside any nav link is ignored", () => {
    initNav();
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("initNav — scroll-driven highlighting", () => {
  test("observes every .l-section with a 0.25 threshold", () => {
    initNav();
    sectionDOM(LABELS.nav[0].key, LABELS.nav[1].key);
    // Sections created after initNav() ran aren't retroactively observed —
    // the observer is set up once, over whatever .l-section elements exist
    // at call time. Re-init to pick up the newly added sections.
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    expect(observer.options).toEqual({ threshold: 0.25 });
    expect(observer.observed).toHaveLength(2);
  });

  test("marks a section's nav link active when it intersects the viewport", () => {
    sectionDOM(LABELS.nav[3].key);
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    observer.callback([
      { isIntersecting: true, target: { id: LABELS.nav[3].key } },
    ]);

    const link = document.querySelector(
      `#sidebar .sidebar-link[data-section="${LABELS.nav[3].key}"]`,
    );
    expect(link.classList.contains("is-active")).toBe(true);
  });

  test("ignores entries that are not currently intersecting", () => {
    sectionDOM(LABELS.nav[4].key);
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    observer.callback([
      { isIntersecting: false, target: { id: LABELS.nav[4].key } },
    ]);

    const link = document.querySelector(
      `#sidebar .sidebar-link[data-section="${LABELS.nav[4].key}"]`,
    );
    expect(link.classList.contains("is-active")).toBe(false);
  });
});
