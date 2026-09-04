jest.mock("dev/public/js/engine/inventory/ammo/model.js", () => ({
  addContainer: jest.fn(),
  moveContainer: jest.fn(),
  removeContainer: jest.fn(),
  addAmmoToContainer: jest.fn(),
  updateContainerAmmoQuantity: jest.fn(),
  removeAmmoFromContainer: jest.fn(),
  addLooseAmmo: jest.fn(),
  updateLooseAmmoQuantity: jest.fn(),
  removeLooseAmmo: jest.fn(),
  moveLooseAmmo: jest.fn(),
  moveAmmoInContainer: jest.fn(),
  updateLooseAmmoOptions: jest.fn(),
  updateLooseAmmoTypeFilter: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/ammo/model.js";
import * as ui from "dev/public/js/ui.js";
import {
  handleAmmoClick,
  handleAmmoInput,
  handleAmmoChange,
  handleAddContainer,
  handleAddLooseAmmo,
} from "dev/public/js/engine/inventory/ammo/events.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

// shared/openState.js is intentionally not mocked — events.js's real ammoDetailKeyFn composes the open-panel snapshot around renderListsPreserving(), which is worth exercising for real here.

function elWithClass(tag, className, dataset = {}) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  return el;
}

function selectWithValue(className, dataset, value) {
  const select = elWithClass("select", className, dataset);
  const option = document.createElement("option");
  option.value = value;
  select.appendChild(option);
  select.value = value;
  return select;
}

beforeEach(() => {
  resetDOM("<div></div>");
  resetState();
  jest.clearAllMocks();
});


describe("handleAmmoClick", () => {
  test("clicking .remove-ammo-container removes the container and returns true", () => {
    const target = elWithClass("button", "remove-ammo-container", {
      instanceId: "C1",
    });

    expect(handleAmmoClick({ target })).toBe(true);
    expect(model.removeContainer).toHaveBeenCalledWith("C1");
  });

  test("clicking .remove-ammo-from-container removes that ammo entry and returns true", () => {
    const target = elWithClass("button", "remove-ammo-from-container", {
      instanceId: "C1",
      ammoId: "ARROW-1",
    });

    expect(handleAmmoClick({ target })).toBe(true);
    expect(model.removeAmmoFromContainer).toHaveBeenCalledWith("C1", "ARROW-1");
  });

  test("clicking .remove-loose-ammo removes that loose entry and returns true", () => {
    const target = elWithClass("button", "remove-loose-ammo", {
      ammoId: "ARROW-1",
      storedAt: "backpack",
    });

    expect(handleAmmoClick({ target })).toBe(true);
    expect(model.removeLooseAmmo).toHaveBeenCalledWith("ARROW-1", "backpack");
  });

  describe("clicking .add-ammo-to-container-btn", () => {
    function setUp({ ammoId = "ARROW-1", qty = "10" } = {}) {
      const select = selectWithValue(
        "ammo-select-for-container",
        { instanceId: "C1" },
        ammoId,
      );
      const qtyInput = elWithClass("input", "ammo-qty-add-input", {
        instanceId: "C1",
      });
      qtyInput.value = qty;
      resetDOM("<div></div>");
      document.body.append(select, qtyInput);
    }

    test("adds the selected ammo/quantity to the container and returns true", () => {
      setUp();
      const target = elWithClass("button", "add-ammo-to-container-btn", {
        instanceId: "C1",
      });

      expect(handleAmmoClick({ target })).toBe(true);
      expect(model.addAmmoToContainer).toHaveBeenCalledWith(
        "C1",
        "ARROW-1",
        10,
      );
    });

    test("returns true but calls nothing when the matching select/input aren't in the DOM", () => {
      resetDOM("<div></div>");
      const target = elWithClass("button", "add-ammo-to-container-btn", {
        instanceId: "C1",
      });

      expect(handleAmmoClick({ target })).toBe(true);
      expect(model.addAmmoToContainer).not.toHaveBeenCalled();
    });

    test("returns true but calls nothing when ammoId is blank", () => {
      setUp({ ammoId: "" });
      const target = elWithClass("button", "add-ammo-to-container-btn", {
        instanceId: "C1",
      });

      expect(handleAmmoClick({ target })).toBe(true);
      expect(model.addAmmoToContainer).not.toHaveBeenCalled();
    });

    test("returns true but calls nothing when quantity is zero or invalid", () => {
      setUp({ qty: "0" });
      const target = elWithClass("button", "add-ammo-to-container-btn", {
        instanceId: "C1",
      });

      expect(handleAmmoClick({ target })).toBe(true);
      expect(model.addAmmoToContainer).not.toHaveBeenCalled();
    });
  });

  test("an unrelated click target returns false", () => {
    const target = document.createElement("div");

    expect(handleAmmoClick({ target })).toBe(false);
  });
});


describe("handleAmmoInput — .ammo-qty-in-container", () => {
  test("a valid quantity updates the container entry and returns true", () => {
    const target = elWithClass("input", "ammo-qty-in-container", {
      instanceId: "C1",
      ammoId: "ARROW-1",
    });
    target.value = "7";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledWith(
      "C1",
      "ARROW-1",
      7,
    );
  });

  test("an in-progress '-' keystroke returns true without calling the model", () => {
    const target = elWithClass("input", "ammo-qty-in-container", {
      instanceId: "C1",
      ammoId: "ARROW-1",
    });
    target.value = "-";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("missing instanceId/ammoId short-circuits without calling the model", () => {
    const target = elWithClass("input", "ammo-qty-in-container", {});
    target.value = "7";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("a non-numeric value is coerced to 0", () => {
    const target = elWithClass("input", "ammo-qty-in-container", {
      instanceId: "C1",
      ammoId: "ARROW-1",
    });
    target.value = "xyz";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledWith(
      "C1",
      "ARROW-1",
      0,
    );
  });
});

describe("handleAmmoInput — .loose-ammo-qty", () => {
  test("a valid quantity updates the loose entry and returns true", () => {
    const target = elWithClass("input", "loose-ammo-qty", {
      ammoId: "ARROW-1",
      storedAt: "backpack",
    });
    target.value = "9";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateLooseAmmoQuantity).toHaveBeenCalledWith(
      "ARROW-1",
      "backpack",
      9,
    );
  });

  test("an empty value returns true without calling the model", () => {
    const target = elWithClass("input", "loose-ammo-qty", {
      ammoId: "ARROW-1",
      storedAt: "backpack",
    });
    target.value = "";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateLooseAmmoQuantity).not.toHaveBeenCalled();
  });

  test("missing ammoId/storedAt short-circuits without calling the model", () => {
    const target = elWithClass("input", "loose-ammo-qty", {});
    target.value = "9";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateLooseAmmoQuantity).not.toHaveBeenCalled();
  });
});

describe("handleAmmoInput — an unrelated input target", () => {
  test("returns false", () => {
    const target = document.createElement("input");

    expect(handleAmmoInput({ target })).toBe(false);
  });
});


describe("handleAmmoInput — .resume-ammo-qty aggregate stepper", () => {
  beforeEach(() => {
    // Two equipped containers holding ARROW-1 (5 + 3 = 8 total), plus one backpack (non-equipped) container excluded from the aggregate.
    state.selected.ammo_containers = [
      {
        _instanceId: "C1",
        storedAt: "equipped",
        contents: [{ ammo_id: "ARROW-1", quantity: 5 }],
      },
      {
        _instanceId: "C2",
        storedAt: "equipped",
        contents: [{ ammo_id: "ARROW-1", quantity: 3 }],
      },
      {
        _instanceId: "C3",
        storedAt: "backpack",
        contents: [{ ammo_id: "ARROW-1", quantity: 10 }],
      },
    ];
  });

  function resumeTarget(newTotal) {
    const target = elWithClass("input", "resume-ammo-qty", {
      ammoId: "ARROW-1",
      instanceId: "C1",
    });
    target.value = String(newTotal);
    return target;
  }

  test("no change (newTotal equals current aggregate) calls nothing", () => {
    expect(handleAmmoInput({ target: resumeTarget(8) })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("incrementing adds the full delta to the first (by-instance-id) container only", () => {
    expect(handleAmmoInput({ target: resumeTarget(10) })).toBe(true);
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledTimes(1);
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledWith(
      "C1",
      "ARROW-1",
      7, // 5 + (10 - 8)
    );
  });

  test("decrementing within the first container's capacity only touches that container", () => {
    expect(handleAmmoInput({ target: resumeTarget(3) })).toBe(true);
    // delta = 3 - 8 = -5; C1 has 5, fully absorbs it.
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledTimes(1);
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledWith(
      "C1",
      "ARROW-1",
      0,
    );
  });

  test("decrementing past the first container's capacity drains into the next equipped container, in order", () => {
    expect(handleAmmoInput({ target: resumeTarget(2) })).toBe(true);
    // delta = 2 - 8 = -6; C1 drains fully (5), remaining 1 comes from C2.
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledTimes(2);
    expect(model.updateContainerAmmoQuantity).toHaveBeenNthCalledWith(
      1,
      "C1",
      "ARROW-1",
      0,
    );
    expect(model.updateContainerAmmoQuantity).toHaveBeenNthCalledWith(
      2,
      "C2",
      "ARROW-1",
      2, // 3 - 1
    );
  });

  test("decrementing to zero drains every equipped container completely and stops", () => {
    expect(handleAmmoInput({ target: resumeTarget(0) })).toBe(true);
    // delta = -8, drains C1 (5) then C2 (3) exactly, nothing left over.
    expect(model.updateContainerAmmoQuantity).toHaveBeenCalledTimes(2);
    expect(model.updateContainerAmmoQuantity).toHaveBeenNthCalledWith(
      1,
      "C1",
      "ARROW-1",
      0,
    );
    expect(model.updateContainerAmmoQuantity).toHaveBeenNthCalledWith(
      2,
      "C2",
      "ARROW-1",
      0,
    );
  });

  test("incrementing when the named first container can't be found calls nothing", () => {
    const target = elWithClass("input", "resume-ammo-qty", {
      ammoId: "ARROW-1",
      instanceId: "DOES-NOT-EXIST",
    });
    target.value = "10";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("an in-progress '-' keystroke returns true without applying anything", () => {
    const target = elWithClass("input", "resume-ammo-qty", {
      ammoId: "ARROW-1",
      instanceId: "C1",
    });
    target.value = "-";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("missing ammoId/instanceId short-circuits without applying anything", () => {
    const target = elWithClass("input", "resume-ammo-qty", {});
    target.value = "10";

    expect(handleAmmoInput({ target })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });

  test("a negative or non-numeric newTotal short-circuits without applying anything", () => {
    expect(handleAmmoInput({ target: resumeTarget(-1) })).toBe(true);
    expect(model.updateContainerAmmoQuantity).not.toHaveBeenCalled();
  });
});


describe("handleAmmoChange", () => {
  test("changing .ammo-container-storage-select moves the container and returns true", () => {
    const target = selectWithValue(
      "ammo-container-storage-select",
      { instanceId: "C1" },
      "backpack",
    );

    expect(handleAmmoChange({ target })).toBe(true);
    expect(model.moveContainer).toHaveBeenCalledWith("C1", "backpack");
  });

  test("changing .loose-ammo-location-select moves the loose entry and returns true", () => {
    const target = selectWithValue(
      "loose-ammo-location-select",
      { ammoId: "ARROW-1", storedAt: "backpack" },
      "stash",
    );

    expect(handleAmmoChange({ target })).toBe(true);
    expect(model.moveLooseAmmo).toHaveBeenCalledWith(
      "ARROW-1",
      "backpack",
      "stash",
    );
  });

  describe("changing .ammo-in-container-move-select", () => {
    test("moves the ammo between containers and returns true", () => {
      const target = selectWithValue(
        "ammo-in-container-move-select",
        { fromInstanceId: "C1", ammoId: "ARROW-1" },
        "C2",
      );

      expect(handleAmmoChange({ target })).toBe(true);
      expect(model.moveAmmoInContainer).toHaveBeenCalledWith(
        "C1",
        "C2",
        "ARROW-1",
      );
    });

    test("returns true but calls nothing when the destination is blank", () => {
      const target = selectWithValue(
        "ammo-in-container-move-select",
        { fromInstanceId: "C1", ammoId: "ARROW-1" },
        "",
      );

      expect(handleAmmoChange({ target })).toBe(true);
      expect(model.moveAmmoInContainer).not.toHaveBeenCalled();
    });

    test("returns true but calls nothing when the destination equals the source", () => {
      const target = selectWithValue(
        "ammo-in-container-move-select",
        { fromInstanceId: "C1", ammoId: "ARROW-1" },
        "C1",
      );

      expect(handleAmmoChange({ target })).toBe(true);
      expect(model.moveAmmoInContainer).not.toHaveBeenCalled();
    });
  });

  test("changing #looseAmmoTypeFilter refreshes the type filter and options, returns true", () => {
    const target = document.createElement("select");
    target.id = "looseAmmoTypeFilter";

    expect(handleAmmoChange({ target })).toBe(true);
    expect(model.updateLooseAmmoTypeFilter).toHaveBeenCalledTimes(1);
    expect(model.updateLooseAmmoOptions).toHaveBeenCalledTimes(1);
  });

  test("an unrelated change target returns false", () => {
    const target = document.createElement("select");

    expect(handleAmmoChange({ target })).toBe(false);
  });
});


describe("handleAddContainer", () => {
  test("adds a container with the selected id and storage location", () => {
    resetDOM(`
      <select id="ammoContainerSelect"><option value="QUIVER-1" selected>Quiver</option></select>
      <select id="ammoContainerStorage"><option value="equipped" selected>Equipado</option></select>
    `);

    handleAddContainer();

    expect(model.addContainer).toHaveBeenCalledWith("QUIVER-1", "equipped");
  });

  test("does nothing when the required selects are missing", () => {
    resetDOM("<div></div>");

    expect(() => handleAddContainer()).not.toThrow();
    expect(model.addContainer).not.toHaveBeenCalled();
  });

  test("does nothing when containerId is blank", () => {
    resetDOM(`
      <select id="ammoContainerSelect"><option value="" selected></option></select>
      <select id="ammoContainerStorage"><option value="equipped" selected>Equipado</option></select>
    `);

    handleAddContainer();

    expect(model.addContainer).not.toHaveBeenCalled();
  });
});


describe("handleAddLooseAmmo", () => {
  test("adds loose ammo with the selected id/quantity/location and resets the quantity field", () => {
    resetDOM(`
      <select id="looseAmmoSelect"><option value="ARROW-1" selected>Flecha</option></select>
      <input id="looseAmmoQty" value="20" />
      <select id="looseAmmoStorage"><option value="backpack" selected>Mochila</option></select>
    `);

    handleAddLooseAmmo();

    expect(model.addLooseAmmo).toHaveBeenCalledWith("ARROW-1", 20, "backpack");
    expect(document.getElementById("looseAmmoQty").value).toBe("1");
  });

  test("does nothing when the required elements are missing", () => {
    resetDOM("<div></div>");

    expect(() => handleAddLooseAmmo()).not.toThrow();
    expect(model.addLooseAmmo).not.toHaveBeenCalled();
  });

  test("does nothing when ammoId is blank", () => {
    resetDOM(`
      <select id="looseAmmoSelect"><option value="" selected></option></select>
      <input id="looseAmmoQty" value="20" />
      <select id="looseAmmoStorage"><option value="backpack" selected>Mochila</option></select>
    `);

    handleAddLooseAmmo();

    expect(model.addLooseAmmo).not.toHaveBeenCalled();
  });

  test("does nothing when quantity is zero or invalid", () => {
    resetDOM(`
      <select id="looseAmmoSelect"><option value="ARROW-1" selected>Flecha</option></select>
      <input id="looseAmmoQty" value="0" />
      <select id="looseAmmoStorage"><option value="backpack" selected>Mochila</option></select>
    `);

    handleAddLooseAmmo();

    expect(model.addLooseAmmo).not.toHaveBeenCalled();
  });
});
