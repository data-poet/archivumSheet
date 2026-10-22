import fs from "fs";
import path from "path";
import {
  createSortableList,
  attachSortableOnce,
  attachReorderableOnce,
  createStorageDragHandler,
  createReorderableList,
} from "dev/public/js/shared/sortable.js";

// Same reasoning as the idiomorph parity test (tests/dev/shared/morph.test.js): the vendored
// copy (sortable.js's only importer) and the devDependency (what gives jest the real library)
// must be the exact same release, or a test passing here proves nothing about what ships.
test("the vendored Sortable build matches the pinned devDependency", () => {
  const vendoredVersion = fs
    .readFileSync(
      path.join(__dirname, "../../../dev/public/vendor/sortable/VERSION"),
      "utf8",
    )
    .trim();
  const { version } = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../../node_modules/sortablejs/package.json"),
      "utf8",
    ),
  );

  expect(vendoredVersion).toBe(version);
});

describe("createSortableList", () => {
  function fakeSortableCreate() {
    const calls = [];
    const Sortable = {
      create: jest.fn((container, options) => {
        calls.push({ container, options });
        return { option: jest.fn(), destroy: jest.fn() };
      }),
    };
    return { Sortable, calls };
  }

  test("returns null without a container", () => {
    const { Sortable } = fakeSortableCreate();
    expect(createSortableList(null, {}, Sortable)).toBeNull();
    expect(Sortable.create).not.toHaveBeenCalled();
  });

  test("applies the shared defaults and the caller's group/handle", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");

    createSortableList(
      container,
      { group: "melee", onDrop: jest.fn() },
      Sortable,
    );

    expect(calls).toHaveLength(1);
    const { options } = calls[0];
    expect(options.group).toBe("melee");
    expect(options.handle).toBe(".drag-handle");
    expect(options.dataIdAttr).toBe("data-instance-id");
    expect(options.delayOnTouchOnly).toBe(true);
    expect(typeof options.delay).toBe("number");
    expect(typeof options.animation).toBe("number");
  });

  test("onEnd calls onDrop with the instance id and both locations", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    const onDrop = jest.fn();

    createSortableList(container, { group: "melee", onDrop }, Sortable);
    const { options } = calls[0];

    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const from = document.createElement("tbody");
    from.dataset.storedAt = "backpack";
    const to = document.createElement("tbody");
    to.dataset.storedAt = "stash";

    options.onEnd({ item, from, to, oldIndex: 0, newIndex: 2 });

    expect(onDrop).toHaveBeenCalledWith({
      instanceId: "INST-1",
      fromLocation: "backpack",
      toLocation: "stash",
      changed: true,
    });
  });

  test("onEnd marks changed:false for a same-location drop", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    const onDrop = jest.fn();

    createSortableList(container, { group: "melee", onDrop }, Sortable);
    const { options } = calls[0];

    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const from = document.createElement("tbody");
    from.dataset.storedAt = "backpack";

    options.onEnd({ item, from, to: from, oldIndex: 0, newIndex: 1 });

    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({ changed: false }),
    );
  });

  test("onEnd is a no-op without an instance id or a destination location", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    const onDrop = jest.fn();

    createSortableList(container, { group: "melee", onDrop }, Sortable);
    const { options } = calls[0];

    const bareItem = document.createElement("tr");
    const to = document.createElement("tbody");
    to.dataset.storedAt = "stash";
    options.onEnd({ item: bareItem, from: to, to, oldIndex: 0, newIndex: 0 });

    expect(onDrop).not.toHaveBeenCalled();
  });

  test("onStart/onEnd carries a dragged row's detail-row along to its new position", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    container.dataset.storedAt = "backpack";

    const other = document.createElement("tr");
    other.id = "other-row";
    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const detail = document.createElement("tr");
    detail.className = "detail-row";
    detail.id = "detail-row-INST-1";
    container.append(other, item, detail);

    createSortableList(container, { group: "melee" }, Sortable);
    const { options } = calls[0];

    options.onStart({ item });
    // Simulate Sortable moving only the dragged row: `other` ends up after `item`, `detail`
    // is left behind at its old position (still right after `item`'s old spot) — exactly the
    // bug this fix targets.
    container.insertBefore(item, other);

    options.onEnd({ item, from: container, to: container });

    expect([...container.children]).toEqual([item, detail, other]);
  });

  test("carries both a magazine-row and a detail-row, in order, for firearms", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    container.dataset.storedAt = "backpack";

    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const magazine = document.createElement("tr");
    magazine.className = "magazine-row";
    const detail = document.createElement("tr");
    detail.className = "detail-row";
    const other = document.createElement("tr");
    container.append(item, magazine, detail, other);

    createSortableList(container, { group: "firearm" }, Sortable);
    const { options } = calls[0];

    options.onStart({ item });
    container.insertBefore(other, item);

    options.onEnd({ item, from: container, to: container });

    expect([...container.children]).toEqual([other, item, magazine, detail]);
  });

  test("a row with no detail-row is unaffected", () => {
    const { Sortable, calls } = fakeSortableCreate();
    const container = document.createElement("tbody");
    container.dataset.storedAt = "backpack";

    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const other = document.createElement("tr");
    container.append(item, other);

    createSortableList(container, { group: "coin" }, Sortable);
    const { options } = calls[0];

    options.onStart({ item });
    options.onEnd({ item, from: container, to: container });

    expect([...container.children]).toEqual([item, other]);
  });
});

describe("attachSortableOnce", () => {
  test("creates a Sortable instance only on the first call for a given container", () => {
    const { Sortable, calls } = fakeSortableCreateForAttach();
    const container = document.createElement("tbody");

    attachSortableOnce(container, { group: "melee" }, Sortable);
    attachSortableOnce(container, { group: "melee" }, Sortable);
    attachSortableOnce(container, { group: "melee" }, Sortable);

    expect(calls).toHaveLength(1);
    expect(container.dataset.sortableBound).toBe("true");
  });

  function fakeSortableCreateForAttach() {
    const calls = [];
    const Sortable = {
      create: jest.fn((container, options) => {
        calls.push({ container, options });
        return { option: jest.fn(), destroy: jest.fn() };
      }),
    };
    return { Sortable, calls };
  }
});

describe("attachReorderableOnce", () => {
  function fakeSortable() {
    const calls = [];
    const Sortable = {
      create: jest.fn((container, options) => {
        calls.push({ container, options });
        return { option: jest.fn(), destroy: jest.fn() };
      }),
    };
    return { Sortable, calls };
  }

  test("creates a Sortable instance only on the first call for a given container", () => {
    const { Sortable, calls } = fakeSortable();
    const container = document.createElement("tbody");

    attachReorderableOnce(container, {}, Sortable);
    attachReorderableOnce(container, {}, Sortable);

    expect(calls).toHaveLength(1);
    expect(container.dataset.sortableBound).toBe("true");
  });

  test("returns null without a container", () => {
    const { Sortable } = fakeSortable();
    expect(attachReorderableOnce(null, {}, Sortable)).toBeNull();
  });
});

describe("createStorageDragHandler", () => {
  function fakeSortable() {
    const calls = [];
    const Sortable = {
      create: jest.fn((container, options) => {
        calls.push({ container, options });
        return { option: jest.fn(), destroy: jest.fn() };
      }),
    };
    return { Sortable, calls };
  }

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("attaches one Sortable instance per storage location, scoped by group", () => {
    const { Sortable, calls } = fakeSortable();
    ["backpack", "stash", "camp"].forEach((location) => {
      const tbody = document.createElement("tbody");
      tbody.id = `melee-tbody-${location}`;
      tbody.dataset.storedAt = location;
      document.body.appendChild(tbody);
    });

    const attach = createStorageDragHandler({
      idPrefix: "melee",
      group: "melee-storage",
      moveFn: jest.fn(),
      locations: ["backpack", "stash", "camp"],
      Sortable,
    });
    attach();

    expect(calls).toHaveLength(3);
    calls.forEach(({ options }) => expect(options.group).toBe("melee-storage"));
  });

  test("calling attach again is a no-op (idempotent per container)", () => {
    const { Sortable, calls } = fakeSortable();
    const tbody = document.createElement("tbody");
    tbody.id = "melee-tbody-backpack";
    document.body.appendChild(tbody);

    const attach = createStorageDragHandler({
      idPrefix: "melee",
      group: "melee-storage",
      moveFn: jest.fn(),
      locations: ["backpack"],
      Sortable,
    });
    attach();
    attach();

    expect(calls).toHaveLength(1);
  });

  test("calls moveFn only when the drop changes location", () => {
    const { Sortable, calls } = fakeSortable();
    const tbody = document.createElement("tbody");
    tbody.id = "melee-tbody-backpack";
    document.body.appendChild(tbody);
    const moveFn = jest.fn();

    createStorageDragHandler({
      idPrefix: "melee",
      group: "melee-storage",
      moveFn,
      locations: ["backpack"],
      Sortable,
    })();

    const { onEnd } = calls[0].options;
    const item = document.createElement("tr");
    item.dataset.instanceId = "INST-1";
    const from = document.createElement("tbody");
    from.dataset.storedAt = "backpack";
    const to = document.createElement("tbody");
    to.dataset.storedAt = "stash";

    onEnd({ item, from, to });
    expect(moveFn).toHaveBeenCalledWith("INST-1", "stash", "backpack");

    onEnd({ item, from, to: from });
    expect(moveFn).toHaveBeenCalledTimes(1);
  });
});

describe("createReorderableList", () => {
  function fakeSortable() {
    const calls = [];
    const Sortable = {
      create: jest.fn((container, options) => {
        calls.push({ container, options });
        return { option: jest.fn(), destroy: jest.fn() };
      }),
    };
    return { Sortable, calls };
  }

  test("returns null without a container", () => {
    const { Sortable } = fakeSortable();
    expect(createReorderableList(null, {}, Sortable)).toBeNull();
  });

  test("onEnd calls onReorder with the moved element", () => {
    const { Sortable, calls } = fakeSortable();
    const container = document.createElement("ul");
    const onReorder = jest.fn();

    createReorderableList(container, { onReorder }, Sortable);
    const item = document.createElement("li");

    calls[0].options.onEnd({ item });

    expect(onReorder).toHaveBeenCalledWith(item);
  });

  test("omits onMove when no canSwap guard is given", () => {
    const { Sortable, calls } = fakeSortable();
    createReorderableList(document.createElement("ul"), {}, Sortable);

    expect(calls[0].options.onMove).toBeUndefined();
  });

  test("onMove delegates to canSwap with the dragged and related elements", () => {
    const { Sortable, calls } = fakeSortable();
    const canSwap = jest.fn(() => false);
    createReorderableList(document.createElement("ul"), { canSwap }, Sortable);

    const dragged = document.createElement("li");
    const related = document.createElement("li");
    const result = calls[0].options.onMove({ dragged, related });

    expect(canSwap).toHaveBeenCalledWith(dragged, related);
    expect(result).toBe(false);
  });
});
