import {
  renderAmmoContainers,
  renderLooseAmmo,
} from "dev/public/js/engine/inventory/ammo/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  ammo: [
    {
      ammo_id: "ARROW-1",
      ammo_name: "Flecha",
      ammo_type: "Flecha",
      ammo_category: "Comum",
    },
    {
      ammo_id: "ARROW-2",
      ammo_name: "Flecha de Fogo",
      ammo_type: "Flecha",
      ammo_category: "Especial",
    },
  ],
  ammo_containers: [
    {
      container_id: "BOX-1",
      container_box_name: "Aljava",
      container_capacity: "20",
      container_ammo_type: "Flecha",
      is_carriable: "TRUE",
    },
  ],
};

beforeEach(() => {
  resetDOM(`<div id="ammoContainerList"></div><div id="looseAmmoList"></div>`);
  resetState();
});

test("the container's own <details> stays open across a re-render", () => {
  const containers = [
    {
      id: "c-a",
      container_id: "BOX-1",
      storedAt: "backpack",
      contents: [{ ammo_id: "ARROW-1", quantity: 5 }],
    },
  ];
  const selected = { ammo_containers: containers };
  const sheet = { inventory: { ammo: { containers: {} } } };

  renderAmmoContainers(selected, data, sheet);

  document.getElementById("ammo-container-c-a").setAttribute("open", "");

  selected.ammo_containers[0].contents[0].quantity = 5;
  renderAmmoContainers(selected, data, sheet);

  expect(document.getElementById("ammo-container-c-a").hasAttribute("open")).toBe(
    true,
  );
});

test("an ammo-entry's quantity input keeps focus/typed value and its own detail <details> stays open across a re-render", () => {
  const containers = [
    {
      id: "c-a",
      container_id: "BOX-1",
      storedAt: "backpack",
      contents: [{ ammo_id: "ARROW-1", quantity: 5 }],
    },
  ];
  const selected = { ammo_containers: containers };
  const sheet = { inventory: { ammo: { containers: {} } } };

  renderAmmoContainers(selected, data, sheet);

  const qtyInput = document.querySelector(
    '.ammo-qty-in-container[data-instance-id="c-a"][data-ammo-id="ARROW-1"]',
  );
  qtyInput.focus();
  qtyInput.value = "9";

  document
    .querySelector("#detail-row-ammo-entry-c-a-ARROW-1 details")
    .setAttribute("open", "");

  renderAmmoContainers(selected, data, sheet);

  expect(document.activeElement.classList.contains("ammo-qty-in-container")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("9");
  expect(
    document
      .querySelector("#detail-row-ammo-entry-c-a-ARROW-1 details")
      .hasAttribute("open"),
  ).toBe(true);
});

test("two ammo containers each keep independent is-card-expanded/open state", () => {
  const containers = [
    {
      id: "c-a",
      container_id: "BOX-1",
      storedAt: "backpack",
      contents: [{ ammo_id: "ARROW-1", quantity: 5 }],
    },
    {
      id: "c-b",
      container_id: "BOX-1",
      storedAt: "stash",
      contents: [{ ammo_id: "ARROW-2", quantity: 3 }],
    },
  ];
  const selected = { ammo_containers: containers };
  const sheet = { inventory: { ammo: { containers: {} } } };

  renderAmmoContainers(selected, data, sheet);
  document.getElementById("ammo-container-c-b").setAttribute("open", "");

  // c-a moves to stash too, reordering within the same list.
  selected.ammo_containers[0].storedAt = "stash";
  renderAmmoContainers(selected, data, sheet);

  expect(document.getElementById("ammo-container-c-a").hasAttribute("open")).toBe(
    false,
  );
  expect(document.getElementById("ammo-container-c-b").hasAttribute("open")).toBe(
    true,
  );
});

test("loose ammo: quantity input keeps focus/typed value and moving between locations doesn't misattribute is-card-expanded", () => {
  const selected = {
    loose_ammo: [
      { id: "l-a", ammo_id: "ARROW-1", storedAt: "stash", quantity: 2 },
      { id: "l-b", ammo_id: "ARROW-2", storedAt: "backpack", quantity: 1 },
    ],
  };
  const sheet = { inventory: { ammo: { loose: {} } } };

  renderLooseAmmo(selected, data, sheet);
  document
    .getElementById("loose-ammo-ARROW-2-backpack")
    .classList.add("is-card-expanded");

  selected.loose_ammo[0].storedAt = "backpack";
  renderLooseAmmo(selected, data, sheet);

  expect(
    document
      .getElementById("loose-ammo-ARROW-2-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document
      .getElementById("loose-ammo-ARROW-1-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(false);
});
