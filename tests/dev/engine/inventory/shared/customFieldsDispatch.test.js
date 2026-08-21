jest.mock("dev/public/js/shared/renderUtils.js", () => ({
  openCustomFieldsEditor: jest.fn(),
  closeCustomFieldsEditor: jest.fn(),
  readCustomFieldsEditorValues: jest.fn(),
}));

import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "dev/public/js/shared/renderUtils.js";
import { createCustomFieldsClickHandler } from "dev/public/js/engine/inventory/shared/customFieldsDispatch.js";

function clickEvent(className, instanceId) {
  const target = document.createElement("button");
  target.classList.add(className);
  target.dataset.instanceId = instanceId;
  return { target };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createCustomFieldsClickHandler", () => {
  test("returns false (not handled) for a click on unrelated markup", () => {
    const handler = createCustomFieldsClickHandler({
      findByInstanceId: jest.fn(),
      saveCustomFields: jest.fn(),
      render: jest.fn(),
    });
    const target = document.createElement("button");
    target.classList.add("some-other-button");

    expect(handler({ target })).toBe(false);
  });

  describe("edit button", () => {
    test("reports unhandled and does nothing when findByInstanceId denies ownership", () => {
      const findByInstanceId = jest.fn(() => undefined);
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId,
        saveCustomFields: jest.fn(),
        render,
      });

      const result = handler(clickEvent("custom-fields-edit-btn", "INST-1"));

      expect(result).toBe(false);
      expect(findByInstanceId).toHaveBeenCalledWith("INST-1");
      expect(openCustomFieldsEditor).not.toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });

    test("opens the editor and re-renders when ownership is confirmed", () => {
      const renderSpy = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields: jest.fn(),
        render: renderSpy,
      });

      const result = handler(clickEvent("custom-fields-edit-btn", "INST-1"));

      expect(result).toBe(true);
      expect(openCustomFieldsEditor).toHaveBeenCalledWith("INST-1");
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancel button", () => {
    test("reports unhandled when ownership is denied", () => {
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => undefined),
        saveCustomFields: jest.fn(),
        render,
      });

      const result = handler(clickEvent("custom-fields-cancel-btn", "INST-1"));

      expect(result).toBe(false);
      expect(closeCustomFieldsEditor).not.toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });

    test("closes the editor and re-renders when ownership is confirmed", () => {
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields: jest.fn(),
        render,
      });

      const result = handler(clickEvent("custom-fields-cancel-btn", "INST-1"));

      expect(result).toBe(true);
      expect(closeCustomFieldsEditor).toHaveBeenCalledWith("INST-1");
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  describe("save button", () => {
    test("reports unhandled and never reads editor values when ownership is denied", () => {
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => undefined),
        saveCustomFields: jest.fn(),
        render: jest.fn(),
      });

      const result = handler(clickEvent("custom-fields-save-btn", "INST-1"));

      expect(result).toBe(false);
      expect(readCustomFieldsEditorValues).not.toHaveBeenCalled();
    });

    test("closes the editor, then calls saveCustomFields when values were read", () => {
      readCustomFieldsEditorValues.mockReturnValue({ note: "hello" });
      const saveCustomFields = jest.fn();
      const render = jest.fn();
      const calls = [];
      closeCustomFieldsEditor.mockImplementation(() => calls.push("close"));
      saveCustomFields.mockImplementation(() => calls.push("save"));

      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields,
        render,
      });

      const result = handler(clickEvent("custom-fields-save-btn", "INST-1"));

      expect(result).toBe(true);
      expect(saveCustomFields).toHaveBeenCalledWith("INST-1", {
        note: "hello",
      });
      expect(render).not.toHaveBeenCalled(); // saveCustomFields owns re-rendering
      expect(calls).toEqual(["close", "save"]); // close happens before save
    });

    test("closes the editor and falls back to render() when values are invalid (falsy)", () => {
      readCustomFieldsEditorValues.mockReturnValue(null);
      const saveCustomFields = jest.fn();
      const render = jest.fn();

      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields,
        render,
      });

      const result = handler(clickEvent("custom-fields-save-btn", "INST-1"));

      expect(result).toBe(true);
      expect(closeCustomFieldsEditor).toHaveBeenCalledWith("INST-1");
      expect(saveCustomFields).not.toHaveBeenCalled();
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  describe("runWithOpenState", () => {
    test("defaults to invoking the work immediately when not provided", () => {
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields: jest.fn(),
        render,
      });

      handler(clickEvent("custom-fields-edit-btn", "INST-1"));

      expect(render).toHaveBeenCalledTimes(1); // ran without an explicit wrapper
    });

    test("is invoked with the triggering event and the unit of work, when provided", () => {
      const runWithOpenState = jest.fn((e, fn) => fn());
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields: jest.fn(),
        render,
        runWithOpenState,
      });
      const event = clickEvent("custom-fields-edit-btn", "INST-1");

      handler(event);

      expect(runWithOpenState).toHaveBeenCalledWith(
        event,
        expect.any(Function),
      );
      expect(render).toHaveBeenCalledTimes(1);
    });

    test("if runWithOpenState never calls the work function, nothing inside it runs", () => {
      const render = jest.fn();
      const handler = createCustomFieldsClickHandler({
        findByInstanceId: jest.fn(() => ({ instance_id: "INST-1" })),
        saveCustomFields: jest.fn(),
        render,
        runWithOpenState: jest.fn(), // deliberately never invokes fn
      });

      handler(clickEvent("custom-fields-edit-btn", "INST-1"));

      expect(openCustomFieldsEditor).not.toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });
  });
});
