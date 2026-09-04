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

// findByInstanceId is the ownership guard (falsy return means the click isn't for this type).
// render doesn't assume any open-state strategy — that belongs inside the function passed in.
// runWithOpenState is only needed when open-state preservation must happen outside render/
// saveCustomFields themselves (e.g. accessories/magicGear's per-container withOpenState, which
// needs the triggering event to know which container was clicked).
export function createCustomFieldsClickHandler({
  findByInstanceId,
  saveCustomFields,
  render,
  runWithOpenState = (e, fn) => fn(),
}) {
  return function handleCustomFieldsClick(e) {
    if (e.target.classList.contains("custom-fields-edit-btn")) {
      const instanceId = e.target.dataset.instanceId;
      if (!findByInstanceId(instanceId)) return false;

      runWithOpenState(e, () => {
        openCustomFieldsEditor(instanceId);
        render();
      });
      return true;
    }

    if (e.target.classList.contains("custom-fields-cancel-btn")) {
      const instanceId = e.target.dataset.instanceId;
      if (!findByInstanceId(instanceId)) return false;

      runWithOpenState(e, () => {
        closeCustomFieldsEditor(instanceId);
        render();
      });
      return true;
    }

    if (e.target.classList.contains("custom-fields-save-btn")) {
      const instanceId = e.target.dataset.instanceId;
      if (!findByInstanceId(instanceId)) return false;

      const values = readCustomFieldsEditorValues(instanceId);

      runWithOpenState(e, () => {
        // Close first so the single render below (whichever branch fires)
        // reflects the read-only view with the saved values, not the form.
        closeCustomFieldsEditor(instanceId);
        if (values) {
          saveCustomFields(instanceId, values);
        } else {
          render();
        }
      });
      return true;
    }

    return false;
  };
}
