// Shared factory for the custom-fields edit/cancel/save click branches, previously copy-pasted
// near-identically across armor, melee, ranged, firearms, shield, accessories, and magicGear.
// The three buttons share generic markup across equipment types (see customFieldsBlock in
// renderUtils.js), so each type must ownership-check the instanceId before acting — that guard,
// plus open/close/read sequencing, is what this factory centralizes.
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../../../shared/renderUtils.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";

// The saveXCustomFields model functions render internally via the global
// renderListsPreserving (unwrapped), which would collapse open <details>
// elsewhere on the page; this snapshots/restores synchronously around them.
// Returns whatever saveCustomFields returns, so a validating caller (customInventory)
// can still signal failure through the wrapper.
export function withPreservedOpenState(saveCustomFields) {
  return function saveCustomFieldsPreserving(instanceId, values) {
    const snapshots = snapshotAll();
    const result = saveCustomFields(instanceId, values);
    restoreAll(snapshots);
    return result;
  };
}

// findByInstanceId is the ownership guard (falsy return means the click isn't for this type).
// render doesn't assume any open-state strategy — that belongs inside the function passed in.
// runWithOpenState is only needed when open-state preservation must happen outside render/
// saveCustomFields themselves (e.g. accessories/magicGear's per-container withOpenState, which
// needs the triggering event to know which container was clicked).
// classPrefix/idAttr let customInventory reuse this for its own "custom-item-*"/customItemId
// markup, which differs from every other equipment type's "custom-fields-*"/instanceId shape.
// readValues likewise differs there: custom items have no "effect" field, so they read via
// readCustomItemEditorValues instead of readCustomFieldsEditorValues.
export function createCustomFieldsClickHandler({
  classPrefix = "custom-fields",
  idAttr = "instanceId",
  findByInstanceId,
  readValues = readCustomFieldsEditorValues,
  saveCustomFields,
  render,
  runWithOpenState = (e, fn) => fn(),
}) {
  const EDIT = `${classPrefix}-edit-btn`;
  const CANCEL = `${classPrefix}-cancel-btn`;
  const SAVE = `${classPrefix}-save-btn`;

  return function handleCustomFieldsClick(e) {
    if (e.target.classList.contains(EDIT)) {
      const instanceId = e.target.dataset[idAttr];
      if (!findByInstanceId(instanceId)) return false;

      runWithOpenState(e, () => {
        openCustomFieldsEditor(instanceId);
        render();
      });
      return true;
    }

    if (e.target.classList.contains(CANCEL)) {
      const instanceId = e.target.dataset[idAttr];
      if (!findByInstanceId(instanceId)) return false;

      runWithOpenState(e, () => {
        closeCustomFieldsEditor(instanceId);
        render();
      });
      return true;
    }

    if (e.target.classList.contains(SAVE)) {
      const instanceId = e.target.dataset[idAttr];
      if (!findByInstanceId(instanceId)) return false;

      const values = readValues(instanceId);

      runWithOpenState(e, () => {
        if (!values) {
          // Close first so the render below reflects the read-only view, not the form.
          closeCustomFieldsEditor(instanceId);
          render();
          return;
        }

        // Close first so a save that renders internally (every current caller does, via
        // renderListsPreserving) reflects the read-only view with the saved values, not the form.
        closeCustomFieldsEditor(instanceId);
        const ok = saveCustomFields(instanceId, values);
        if (ok === false) {
          // Invalid input (customInventory only): reopen so the user's typed values stay
          // visible, and skip re-rendering — a re-render would pull fresh markup from
          // committed state and revert what the user just typed.
          openCustomFieldsEditor(instanceId);
        }
      });
      return true;
    }

    return false;
  };
}
