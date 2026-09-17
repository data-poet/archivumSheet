import {
  withOpenState,
  snapshotAll,
  restoreAll,
  detailKeyFn,
} from "dev/public/js/shared/openState.js";

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = "";
});

afterEach(() => {
  jest.useRealTimers();
});

// Realistic managed-container markup: the key lives on the row preceding the
// .detail-row, which is what detailKeyFn walks back to find.
function rowScope(instanceId, { open = false } = {}) {
  return `
    <table><tbody id="scope">
      <tr data-instance-id="${instanceId}"></tr>
      <tr class="detail-row"><td><details ${open ? "open" : ""}></details></td></tr>
    </tbody></table>
  `;
}

function rebuildScopeAs(html) {
  return jest.fn(() => {
    document.querySelector("#scope").innerHTML = html;
  });
}

describe("withOpenState", () => {
  test("renderFn is deferred by one animation frame, not called synchronously", () => {
    document.body.innerHTML = `<div id="scope"></div>`;
    const renderFn = jest.fn();

    withOpenState("#scope", renderFn);
    expect(renderFn).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  test("an open <details> is re-opened after renderFn rebuilds the DOM", () => {
    document.body.innerHTML = rowScope("ITEM-1", { open: true });
    const renderFn = rebuildScopeAs(`
      <tr data-instance-id="ITEM-1"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `);

    withOpenState("#scope", renderFn);
    jest.advanceTimersToNextFrame();

    expect(document.querySelector("#scope details").hasAttribute("open")).toBe(
      true,
    );
  });

  test("a <details> that was closed before the render stays closed after it", () => {
    document.body.innerHTML = rowScope("ITEM-1");
    const renderFn = rebuildScopeAs(`
      <tr data-instance-id="ITEM-1"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `);

    withOpenState("#scope", renderFn);
    jest.advanceTimersToNextFrame();

    expect(document.querySelector("#scope details").hasAttribute("open")).toBe(
      false,
    );
  });

  test("a stale key from before the render (item removed) is dropped, not applied to an unrelated element", () => {
    document.body.innerHTML = rowScope("ITEM-1", { open: true });
    const renderFn = rebuildScopeAs(`
      <tr data-instance-id="ITEM-2"></tr>
      <tr class="detail-row"><td><details></details></td></tr>
    `);

    withOpenState("#scope", renderFn);
    expect(() => jest.advanceTimersToNextFrame()).not.toThrow();

    expect(document.querySelector("#scope details").hasAttribute("open")).toBe(
      false,
    );
  });

  test(".table-wrapper horizontal scroll position is restored after the render", () => {
    document.body.innerHTML = `
      <div id="scope">
        <div class="table-wrapper"></div>
      </div>
    `;
    const wrapper = document.querySelector(".table-wrapper");
    Object.defineProperty(wrapper, "scrollLeft", { value: 42, writable: true });

    const renderFn = rebuildScopeAs(`<div class="table-wrapper"></div>`);

    withOpenState("#scope", renderFn);
    jest.advanceTimersToNextFrame();

    expect(document.querySelector("#scope .table-wrapper").scrollLeft).toBe(42);
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

    withOpenState("#scope", renderFn);
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

    withOpenState("#scope", renderFn);
    jest.advanceTimersToNextFrame();

    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
  });

  test("when the scope selector matches nothing, renderFn still runs (deferred one frame) and nothing throws", () => {
    const renderFn = jest.fn();

    expect(() => withOpenState("#missing", renderFn)).not.toThrow();
    expect(renderFn).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  test("two sibling <details> for the same instance stay independently scoped via data-detail-kind", () => {
    document.body.innerHTML = `
      <table><tbody id="scope">
        <tr data-instance-id="ITEM-1"></tr>
        <tr class="detail-row"><td><details data-detail-kind="stats" open></details></td></tr>
        <tr class="detail-row"><td><details data-detail-kind="customize"></details></td></tr>
      </tbody></table>
    `;
    const renderFn = rebuildScopeAs(`
      <tr data-instance-id="ITEM-1"></tr>
      <tr class="detail-row"><td><details data-detail-kind="stats"></details></td></tr>
      <tr class="detail-row"><td><details data-detail-kind="customize"></details></td></tr>
    `);

    withOpenState("#scope", renderFn);
    jest.advanceTimersToNextFrame();

    expect(
      document.querySelector('[data-detail-kind="stats"]').hasAttribute("open"),
    ).toBe(true);
    expect(
      document
        .querySelector('[data-detail-kind="customize"]')
        .hasAttribute("open"),
    ).toBe(false);
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

describe("detailKeyFn", () => {
  function detailsAfter(rowsHtml) {
    document.body.innerHTML = `<table><tbody>${rowsHtml}</tbody></table>`;
    return document.querySelector("details");
  }

  describe("table rows", () => {
    test("keys off data-instance-id on the row preceding the detail row", () => {
      const details = detailsAfter(`
        <tr data-instance-id="ITEM-1"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe("ITEM-1");
    });

    test("finds the key on a descendant of the preceding row, not just the row itself", () => {
      const details = detailsAfter(`
        <tr><td><button data-instance-id="ITEM-1"></button></td></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe("ITEM-1");
    });

    test("walks back past intervening .detail-row siblings to reach the data row", () => {
      document.body.innerHTML = `
        <table><tbody>
          <tr data-instance-id="ITEM-1"></tr>
          <tr class="detail-row"><td><details id="first"></details></td></tr>
          <tr class="detail-row"><td><details id="second"></details></td></tr>
        </tbody></table>
      `;

      expect(detailKeyFn(document.getElementById("second"))).toBe("ITEM-1");
    });

    test("stops at a non-detail row that carries no key rather than scanning the whole table", () => {
      const details = detailsAfter(`
        <tr data-instance-id="ITEM-1"></tr>
        <tr></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBeNull();
    });

    test.each([
      ["data-id", "SKILL-9"],
      ["data-name", "Espada"],
      ["data-custom-item-id", "CUSTOM-3"],
    ])("falls back to %s when data-instance-id is absent", (attr, value) => {
      const details = detailsAfter(`
        <tr ${attr}="${value}"></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe(value);
    });

    test("appends data-detail-kind so sibling panels for one instance don't share a key", () => {
      const details = detailsAfter(`
        <tr data-instance-id="ITEM-1"></tr>
        <tr class="detail-row"><td><details data-detail-kind="tabs"></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe("ITEM-1:tabs");
    });
  });

  // An ammo entry is identified by (container, ammo). Keying on the container's
  // data-instance-id alone made every entry in a container share one key, so
  // opening one entry's details reopened all of them on the next re-render.
  describe("ammo rows", () => {
    test("composes container instance id with ammo id, taking precedence over data-instance-id", () => {
      const details = detailsAfter(`
        <tr><td>
          <input data-instance-id="CONTAINER-1" data-ammo-id="AMMO-1" />
        </td></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe("CONTAINER-1:AMMO-1");
    });

    test("two entries in the SAME container get distinct keys", () => {
      document.body.innerHTML = `
        <table><tbody>
          <tr><td><input data-instance-id="CONTAINER-1" data-ammo-id="AMMO-1" /></td></tr>
          <tr class="detail-row"><td><details id="one"></details></td></tr>
          <tr><td><input data-instance-id="CONTAINER-1" data-ammo-id="AMMO-2" /></td></tr>
          <tr class="detail-row"><td><details id="two"></details></td></tr>
        </tbody></table>
      `;

      expect(detailKeyFn(document.getElementById("one"))).toBe(
        "CONTAINER-1:AMMO-1",
      );
      expect(detailKeyFn(document.getElementById("two"))).toBe(
        "CONTAINER-1:AMMO-2",
      );
    });

    test("loose ammo (no container) keys with an empty instance-id segment", () => {
      const details = detailsAfter(`
        <tr><td><input data-ammo-id="AMMO-1" data-stored-at="backpack" /></td></tr>
        <tr class="detail-row"><td><details></details></td></tr>
      `);

      expect(detailKeyFn(details)).toBe(":AMMO-1");
    });

    test("snapshotAll/restoreAll reopens only the ammo entry that was open", () => {
      const markup = `
        <div id="ammoContainerList"><table><tbody>
          <tr><td><input data-instance-id="CONTAINER-1" data-ammo-id="AMMO-1" /></td></tr>
          <tr class="detail-row"><td><details id="one"></details></td></tr>
          <tr><td><input data-instance-id="CONTAINER-1" data-ammo-id="AMMO-2" /></td></tr>
          <tr class="detail-row"><td><details id="two"></details></td></tr>
        </tbody></table></div>
      `;
      document.body.innerHTML = markup;
      document.getElementById("one").setAttribute("open", "");

      const snapshot = snapshotAll();
      document.body.innerHTML = markup; // re-render: nothing open
      restoreAll(snapshot);

      expect(document.getElementById("one").hasAttribute("open")).toBe(true);
      expect(document.getElementById("two").hasAttribute("open")).toBe(false);
    });
  });

  describe("equipped-slot blocks", () => {
    test("keys off data-instance-id on the preceding sibling block", () => {
      document.body.innerHTML = `
        <div id="slots">
          <div class="equipped-slot-grid" data-instance-id="ITEM-1"></div>
          <div class="equipped-detail"><details></details></div>
        </div>
      `;

      expect(detailKeyFn(document.querySelector("details"))).toBe("ITEM-1");
    });

    test("falls back to data-slot when there is no instance id (armor slots)", () => {
      document.body.innerHTML = `
        <div id="slots">
          <div class="equipped-slot-grid" data-slot="Torso"></div>
          <div class="equipped-detail"><details></details></div>
        </div>
      `;

      expect(detailKeyFn(document.querySelector("details"))).toBe("Torso");
    });

    test("walks back past sibling .equipped-detail blocks to reach the slot block", () => {
      document.body.innerHTML = `
        <div id="slots">
          <div class="equipped-slot-grid" data-instance-id="ITEM-1"></div>
          <div class="equipped-detail"><details id="first"></details></div>
          <div class="equipped-detail"><details id="second"></details></div>
        </div>
      `;

      expect(detailKeyFn(document.getElementById("second"))).toBe("ITEM-1");
    });
  });

  test("returns null for a <details> in neither a table row nor an equipped-slot block", () => {
    document.body.innerHTML = `<div><details></details></div>`;

    expect(detailKeyFn(document.querySelector("details"))).toBeNull();
  });
});
