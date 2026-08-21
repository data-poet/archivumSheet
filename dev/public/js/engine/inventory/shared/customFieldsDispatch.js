/**
 * customFieldsDispatch.js
 *
 * Shared factory for the custom-fields edit/cancel/save click branches,
 * previously copy-pasted near-identically across armor, melee, ranged,
 * firearms, shield, accessories, and magicGear's events.js files.
 *
 * The three buttons (.custom-fields-edit-btn / -cancel-btn / -save-btn)
 * are generic markup shared by every equipment type (see customFieldsBlock
 * in renderUtils.js) — each type's handler must ownership-check the
 * instanceId before acting, so types can safely share those button
 * classes without one type's handler swallowing another type's clicks.
 * That guard, and the open/close/read sequencing, is what this factory
 * centralizes; each type still supplies its own data-layer functions and
 * decides how re-rendering + open-state preservation happens for it.
 */
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../../../shared/renderUtils.js";

/**
 * @param {Object} config
 * @param {(instanceId: string) => object|undefined} config.findByInstanceId
 *        Ownership check — if this returns falsy, the click isn't for this
 *        type and the returned handler reports it didn't handle the event.
 * @param {(instanceId: string, values: object) => void} config.saveCustomFields
 *        Called with the values read from the open editor. Expected to
 *        mutate state and trigger whatever re-render/engine-run this type
 *        normally does on save (matches every existing saveXCustomFields).
 * @param {() => void} config.render
 *        Re-renders this type's own list(s) after opening/closing the
 *        editor, or after a save with no changed values. Whatever
 *        open-state preservation this type wants (single-container
 *        withOpenState, snapshotAll/restoreAll, or none) belongs inside
 *        this function — the factory doesn't assume either strategy.
 * @param {(e: Event, fn: () => void) => void} [config.runWithOpenState]
 *        Optional wrapper invoked around each open/close/save unit of
 *        work, given the triggering event and the work to run. Defaults
 *        to calling the work immediately. Only needed if a type wants
 *        open-state preservation applied OUTSIDE of `render`/
 *        `saveCustomFields` themselves (e.g. accessories/magicGear's
 *        per-container withOpenState, which needs `e` to know which
 *        container was clicked).
 * @returns {(e: Event) => boolean} click handler — pass this straight
 *          through as (part of) the type's handleXClick.
 */
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
