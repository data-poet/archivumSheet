import {
  withOpenState,
  snapshotAll,
  restoreAll,
  tableRowKeyFn,
  divBlockKeyFn,
  ammoDetailKeyFn,
} from "dev/public/js/shared/openState.js";

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = "";
});

afterEach(() => {
  jest.useRealTimers();
});

describe("withOpenState", () => {
  test("renderFn is deferred by one animation frame, not called synchronously", () => {
    document.body.innerHTML = `<div id="scope"></div>`;
    const renderFn = jest.fn();

    withOpenState("#scope", () => null, renderFn);
    expect(renderFn).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  test("an open <details> matching keyFn is re-opened after renderFn rebuilds the DOM", () => {
    document.body.innerHTML = `
      <div id="scope">
        <details data-instance-id="ITEM-1" open></details>
      </div>
    `;
    const keyFn = (el) => el.getAttribute("data-instance-id");

    const renderFn = jest.fn(() => {
      document.querySelector("#scope").innerHTML = `
        <details data-instance-id="ITEM-1"></details>
      `;
    });

    withOpenState("#scope", keyFn, renderFn);
    jest.advanceTimersToNextFrame();

    const rebuilt = document.querySelector(
      '#scope details[data-instance-id="ITEM-1"]',
    );
    expect(rebuilt.hasAttribute("open")).toBe(true);
  });

  test("a <details> that was closed before the render stays closed after it", () => {
    document.body.innerHTML = `
      <div id="scope">
        <details data-instance-id="ITEM-1"></details>
      </div>
    `;
    const keyFn = (el) => el.getAttribute("data-instance-id");
    const renderFn = jest.fn(() => {
      document.querySelector("#scope").innerHTML = `
        <details data-instance-id="ITEM-1"></details>
      `;
    });

    withOpenState("#scope", keyFn, renderFn);
    jest.advanceTimersToNextFrame();

    const rebuilt = document.querySelector(
      '#scope details[data-instance-id="ITEM-1"]',
    );
    expect(rebuilt.hasAttribute("open")).toBe(false);
  });

  test("a stale key from before the render (item removed) is simply dropped, not applied to an unrelated element", () => {
    document.body.innerHTML = `
      <div id="scope">
        <details data-instance-id="ITEM-1" open></details>
      </div>
    `;
    const keyFn = (el) => el.getAttribute("data-instance-id");
    const renderFn = jest.fn(() => {
      document.querySelector("#scope").innerHTML = `
        <details data-instance-id="ITEM-2"></details>
      `;
    });

    withOpenState("#scope", keyFn, renderFn);
    expect(() => jest.advanceTimersToNextFrame()).not.toThrow();

    const survivor = document.querySelector(
      '#scope details[data-instance-id="ITEM-2"]',
    );
    expect(survivor.hasAttribute("open")).toBe(false);
  });

  test(".table-wrapper horizontal scroll position is restored after the render", () => {
    document.body.innerHTML = `
      <div id="scope">
        <div class="table-wrapper"></div>
      </div>
    `;
    const wrapper = document.querySelector(".table-wrapper");
    Object.defineProperty(wrapper, "scrollLeft", {
      value: 42,
      writable: true,
    });

    const renderFn = jest.fn(() => {
      document.querySelector("#scope").innerHTML = `
        <div class="table-wrapper"></div>
      `;
    });

    withOpenState("#scope", () => null, renderFn);
    jest.advanceTimersToNextFrame();

    const rebuiltWrapper = document.querySelector("#scope .table-wrapper");
    expect(rebuiltWrapper.scrollLeft).toBe(42);
  });

  test("the page's vertical scroll position is restored if renderFn changed it", () => {
    document.body.innerHTML = `<div id="scope"></div>`;
    Object.defineProperty(window, "scrollY", { value: 250, writable: true });

    const renderFn = jest.fn(() => {
      window.scrollY = 0;
    });
    const scrollToSpy = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    withOpenState("#scope", () => null, renderFn);
    jest.advanceTimersToNextFrame();

    expect(scrollToSpy).toHaveBeenCalledWith(0, 250);
    scrollToSpy.mockRestore();
  });

  test("window.scrollTo is NOT called when the scroll position never changed", () => {
    document.body.innerHTML = `<div id="scope"></div>`;
    Object.defineProperty(window, "scrollY", { value: 100, writable: true });
    const renderFn = jest.fn();
    const scrollToSpy = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    withOpenState("#scope", () => null, renderFn);
    jest.advanceTimersToNextFrame();

    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
  });

  test("when the scope selector matches nothing, renderFn still runs (deferred one frame) and nothing throws", () => {
    const renderFn = jest.fn();

    expect(() => withOpenState("#missing", () => null, renderFn)).not.toThrow();
    expect(renderFn).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  test("two sibling <details> for the same instance stay independently scoped when keyFn differentiates them (data-detail-kind)", () => {
    // Drives the real tableRowKeyFn (not a hand-rolled keyFn) so it exercises the
    // internal _withDetailKind composition that keeps sibling panels independent.
    document.body.innerHTML = `
      <table><tbody id="scope">
        <tr data-instance-id="ITEM-1"></tr>
        <tr class="detail-row"><td><details data-detail-kind="stats" open></details></td></tr>
        <tr class="detail-row"><td><details data-detail-kind="customize"></details></td></tr>
      </tbody></table>
    `;
    const keyFn = tableRowKeyFn("data-instance-id");
    const renderFn = jest.fn(() => {
      document.querySelector("#scope").innerHTML = `
        <tr data-instance-id="ITEM-1"></tr>
        <tr class="detail-row"><td><details data-detail-kind="stats"></details></td></tr>
        <tr class="detail-row"><td><details data-detail-kind="customize"></details></td></tr>
      `;
    });

    withOpenState("#scope", keyFn, renderFn);
    jest.advanceTimersToNextFrame();

    const stats = document.querySelector('[data-detail-kind="stats"]');
    const customize = document.querySelector('[data-detail-kind="customize"]');
    expect(stats.hasAttribute("open")).toBe(true);
    expect(customize.hasAttribute("open")).toBe(false);
  });
});

describe("snapshotAll / restoreAll", () => {
  test("captures open state independently per managed container and restores each correctly", () => {
    document.body.innerHTML = `
      <table id="advList"><tbody>
        <tr data-instance-id="ADV-1"></tr>
        <tr class="detail-row"><td><details open></details></td></tr>
      </tbody></table>
      <table id="skillList"><tbody>
        <tr data-instance-id="SKILL-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;

    const snapshot = snapshotAll();

    document.querySelector("#advList tbody").innerHTML = `
      <tr data-instance-id="ADV-1"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `;
    document.querySelector("#skillList tbody").innerHTML = `
      <tr data-instance-id="SKILL-1"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `;

    restoreAll(snapshot);

    const advDetails = document.querySelector("#advList details");
    const skillDetails = document.querySelector("#skillList details");
    expect(advDetails.hasAttribute("open")).toBe(true);
    expect(skillDetails.hasAttribute("open")).toBe(false);
  });

  test("a container id from MANAGED_CONTAINER_IDS that isn't present in the DOM is skipped without throwing", () => {
    document.body.innerHTML = `<table id="advList"><tbody></tbody></table>`;

    expect(() => snapshotAll()).not.toThrow();
  });

  test("restoreAll skips a container id absent from the current DOM without throwing", () => {
    document.body.innerHTML = `
      <table id="advList"><tbody>
        <tr data-instance-id="ADV-1"></tr>
        <tr class="detail-row"><td><details open></details></td></tr>
      </tbody></table>
    `;
    const snapshot = snapshotAll();

    document.body.innerHTML = "";

    expect(() => restoreAll(snapshot)).not.toThrow();
  });

  test("restoreAll is a synchronous call — no rAF deferral, unlike withOpenState", () => {
    document.body.innerHTML = `
      <table id="advList"><tbody>
        <tr data-instance-id="ADV-1"></tr>
        <tr class="detail-row"><td><details open></details></td></tr>
      </tbody></table>
    `;
    const snapshot = snapshotAll();
    document.querySelector("#advList tbody").innerHTML = `
      <tr data-instance-id="ADV-1"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `;

    restoreAll(snapshot);

    // No advanceTimersToNextFrame call — a deferred restoreAll would fail this immediately.
    const details = document.querySelector("#advList details");
    expect(details.hasAttribute("open")).toBe(true);
  });

  test("restores .table-wrapper scroll positions per container using snapshotAll's generic keyFn", () => {
    document.body.innerHTML = `
      <div id="armorSlots">
        <div class="table-wrapper"></div>
      </div>
    `;
    const wrapper = document.querySelector("#armorSlots .table-wrapper");
    Object.defineProperty(wrapper, "scrollLeft", {
      value: 77,
      writable: true,
    });

    const snapshot = snapshotAll();
    document.querySelector("#armorSlots").innerHTML = `
      <div class="table-wrapper"></div>
    `;
    restoreAll(snapshot);

    const rebuilt = document.querySelector("#armorSlots .table-wrapper");
    expect(rebuilt.scrollLeft).toBe(77);
  });
});

describe("tableRowKeyFn", () => {
  test("reads the key attribute off the immediately preceding data row", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr data-instance-id="ROW-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");
    const keyFn = tableRowKeyFn("data-instance-id");

    expect(keyFn(details)).toBe("ROW-1");
  });

  test("walks back through several sibling .detail-row rows to find the owning data row", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr data-instance-id="ROW-1"></tr>
        <tr class="detail-row"><td><details data-detail-kind="stats"></details></td></tr>
        <tr class="detail-row"><td><details data-detail-kind="customize"></details></td></tr>
      </tbody></table>
    `;
    const secondDetail = document.querySelector(
      '[data-detail-kind="customize"]',
    );
    const keyFn = tableRowKeyFn("data-instance-id");

    expect(keyFn(secondDetail)).toBe("ROW-1:customize");
  });

  test("returns null when no ancestor <tr> exists at all", () => {
    document.body.innerHTML = `<div><details></details></div>`;
    const details = document.querySelector("details");
    const keyFn = tableRowKeyFn("data-instance-id");

    expect(keyFn(details)).toBeNull();
  });

  test("returns null when walking back hits a non-detail row before finding the key", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr><td>unrelated header row, no key attr</td></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");
    const keyFn = tableRowKeyFn("data-instance-id");

    expect(keyFn(details)).toBeNull();
  });

  test("finds the key on a descendant element of the data row, not just the row itself", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr><td><span data-instance-id="ROW-1"></span></td></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");
    const keyFn = tableRowKeyFn("data-instance-id");

    expect(keyFn(details)).toBe("ROW-1");
  });
});

describe("divBlockKeyFn", () => {
  test("reads the key attribute off the immediately preceding sibling block", () => {
    document.body.innerHTML = `
      <div>
        <div data-instance-id="SLOT-1"></div>
        <div class="equipped-detail"><details></details></div>
      </div>
    `;
    const details = document.querySelector("details");
    const keyFn = divBlockKeyFn("data-instance-id");

    expect(keyFn(details)).toBe("SLOT-1");
  });

  test("walks back through several preceding siblings to find the owning slot block", () => {
    document.body.innerHTML = `
      <div>
        <div data-instance-id="SLOT-1"></div>
        <div class="equipped-detail"><details data-detail-kind="stats"></details></div>
        <div class="equipped-detail"><details data-detail-kind="customize"></details></div>
      </div>
    `;
    const secondDetail = document.querySelector(
      '[data-detail-kind="customize"]',
    );
    const keyFn = divBlockKeyFn("data-instance-id");

    expect(keyFn(secondDetail)).toBe("SLOT-1:customize");
  });

  test("returns null when no ancestor .equipped-detail block exists", () => {
    document.body.innerHTML = `<div><details></details></div>`;
    const details = document.querySelector("details");
    const keyFn = divBlockKeyFn("data-instance-id");

    expect(keyFn(details)).toBeNull();
  });

  test("returns null when no preceding sibling carries the key attribute", () => {
    document.body.innerHTML = `
      <div>
        <div class="equipped-detail"><details></details></div>
      </div>
    `;
    const details = document.querySelector("details");
    const keyFn = divBlockKeyFn("data-instance-id");

    expect(keyFn(details)).toBeNull();
  });
});

describe("ammoDetailKeyFn", () => {
  test("composes containerInstanceId:ammoId from the preceding data row", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr data-instance-id="CONTAINER-1" data-ammo-id="AMMO-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");

    expect(ammoDetailKeyFn(details)).toBe("CONTAINER-1:AMMO-1");
  });

  test("finds data-instance-id and data-ammo-id on descendant elements of the row, not just the row itself", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr>
          <td><span data-instance-id="CONTAINER-1"></span></td>
          <td><span data-ammo-id="AMMO-1"></span></td>
        </tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");

    expect(ammoDetailKeyFn(details)).toBe("CONTAINER-1:AMMO-1");
  });

  test("composes with an empty container id segment when only ammoId is present", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr data-ammo-id="AMMO-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");

    expect(ammoDetailKeyFn(details)).toBe(":AMMO-1");
  });

  test("returns null when the preceding row has no data-ammo-id at all", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr data-instance-id="CONTAINER-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      </tbody></table>
    `;
    const details = document.querySelector("details");

    expect(ammoDetailKeyFn(details)).toBeNull();
  });

  test("returns null when no ancestor <tr> exists", () => {
    document.body.innerHTML = `<div><details></details></div>`;
    const details = document.querySelector("details");

    expect(ammoDetailKeyFn(details)).toBeNull();
  });
});
