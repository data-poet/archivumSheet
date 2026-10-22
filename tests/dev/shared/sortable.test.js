import fs from "fs";
import path from "path";
import {
  createSortableList,
  attachSortableOnce,
  createStorageDragHandler,
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
