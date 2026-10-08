jest.mock("dev/public/js/store/characters.js", () => ({
  getActiveCharacterId: jest.fn(),
  getStore: jest.fn(),
}));
jest.mock("dev/public/js/shared/toast.js", () => ({
  showToast: jest.fn(),
}));

import { resetDOM } from "tests/dev/helpers/domFixture.js";
import {
  getActiveCharacterId,
  getStore,
} from "dev/public/js/store/characters.js";
import { showToast } from "dev/public/js/shared/toast.js";
import {
  sendToAllyRowHTML,
  createSendToAllyHandler,
} from "dev/public/js/engine/inventory/shared/sendToAllyControl.js";

function setStore({ activeId, allies, otherEntries = [] }) {
  getActiveCharacterId.mockReturnValue(activeId);
  getStore.mockReturnValue({
    activeId,
    list: [
      {
        id: activeId,
        name: "Hero",
        data: { character: { allies: allies.map((a) => ({ ally_id: a.id })) } },
      },
      ...allies,
      ...otherEntries,
    ],
  });
}

beforeEach(() => {
  resetDOM("<div id='root'></div>");
  jest.clearAllMocks();
});

describe("sendToAllyRowHTML", () => {
  test("lists the active character's linked allies as options, in roster order", () => {
    setStore({
      activeId: "char-1",
      allies: [
        { id: "ally-1", name: "Rook" },
        { id: "ally-2", name: "Finch" },
      ],
    });

    const html = sendToAllyRowHTML("item-1");
    document.getElementById("root").innerHTML = html;

    const options = [...document.querySelectorAll(".send-to-ally-select option")].map(
      (o) => o.value,
    );
    expect(options).toEqual(["ally-1", "ally-2"]);
    expect(document.querySelector(".send-to-ally-select option").textContent).toBe("Rook");
  });

  test("renders nothing when there are no linked allies", () => {
    setStore({ activeId: "char-1", allies: [] });

    const html = sendToAllyRowHTML("item-1");

    expect(html).toBe("");
  });

  test("includes a quantity input only when needsQuantity is true", () => {
    setStore({ activeId: "char-1", allies: [{ id: "ally-1", name: "Rook" }] });

    const withQuantity = sendToAllyRowHTML("item-1", { needsQuantity: true, maxQuantity: 7 });
    document.getElementById("root").innerHTML = withQuantity;
    const input = document.querySelector(".send-to-ally-quantity");
    expect(input).not.toBeNull();
    expect(input.max).toBe("7");
    expect(input.value).toBe("7");

    const withoutQuantity = sendToAllyRowHTML("item-1");
    document.getElementById("root").innerHTML = withoutQuantity;
    expect(document.querySelector(".send-to-ally-quantity")).toBeNull();
  });
});

describe("createSendToAllyHandler", () => {
  test("ignores clicks on unrelated elements", () => {
    const sendFn = jest.fn();
    const render = jest.fn();
    const handler = createSendToAllyHandler({ sendFn, render });

    const button = document.createElement("button");
    const handled = handler({ target: button });

    expect(handled).toBe(false);
    expect(sendFn).not.toHaveBeenCalled();
  });

  test("calls sendFn with instance id + destination and renders on success", () => {
    setStore({ activeId: "char-1", allies: [{ id: "ally-1", name: "Rook" }] });
    document.getElementById("root").innerHTML = sendToAllyRowHTML("item-1");

    const sendFn = jest.fn().mockReturnValue(true);
    const render = jest.fn();
    const handler = createSendToAllyHandler({ sendFn, render });

    const button = document.querySelector(".send-to-ally-button");
    const handled = handler({ target: button });

    expect(handled).toBe(true);
    expect(sendFn).toHaveBeenCalledWith("item-1", "ally-1");
    expect(render).toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  test("reads the quantity input's value and passes it through when present", () => {
    setStore({ activeId: "char-1", allies: [{ id: "ally-1", name: "Rook" }] });
    document.getElementById("root").innerHTML = sendToAllyRowHTML("item-1", {
      needsQuantity: true,
      maxQuantity: 10,
    });
    document.querySelector(".send-to-ally-quantity").value = "4";

    const sendFn = jest.fn().mockReturnValue(true);
    const render = jest.fn();
    const handler = createSendToAllyHandler({ sendFn, render });

    handler({ target: document.querySelector(".send-to-ally-button") });

    expect(sendFn).toHaveBeenCalledWith("item-1", "ally-1", 4);
  });

  test("shows an error toast and does not render when sendFn fails", () => {
    setStore({ activeId: "char-1", allies: [{ id: "ally-1", name: "Rook" }] });
    document.getElementById("root").innerHTML = sendToAllyRowHTML("item-1");

    const sendFn = jest.fn().mockReturnValue(false);
    const render = jest.fn();
    const handler = createSendToAllyHandler({ sendFn, render });

    handler({ target: document.querySelector(".send-to-ally-button") });

    expect(render).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.any(String), "error");
  });
});
