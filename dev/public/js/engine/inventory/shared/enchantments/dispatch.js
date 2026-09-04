// Shared factory for the enchantments add/remove/save click branches and the
// category/type/target cascading-filter change branches, previously copy-pasted
// byte-for-byte between accessories/events.js and magicGear/events.js.
// readEnchantmentFormParams and the clear/set form-selection helpers have zero variance
// across equipment types (they only touch the shared UI-state Maps in model.js), so
// they're used directly here rather than threaded through as config.
import {
  setEnchantmentAddFormSelection,
  setEnchantmentAddFormTargetFilter,
  setEnchantmentAddFormTypeFilter,
  clearEnchantmentAddFormSelection,
} from "./model.js";

// Reads a not-yet-committed enchantment form straight out of the DOM (uncontrolled inputs —
// nothing writes to state until "Adicionar"/"Salvar" is pressed). formKey is either the parent
// item's instanceId (add-form) or an entry's own _instanceId (edit-form) — same shared markup.
export function readEnchantmentFormParams(formKey) {
  const form = document.querySelector(
    `.enchantment-form[data-form-key="${formKey}"]`,
  );
  if (!form) return null;

  const enchantmentId = form.querySelector(".enchantment-type-select")?.value;
  if (!enchantmentId) return null;

  const valueEl = form.querySelector(".enchantment-value-input");
  const targetEl = form.querySelector(".enchantment-target-select");
  const extraPointsEl = form.querySelector(".enchantment-extra-points-input");

  return {
    enchantmentId,
    value: valueEl ? parseInt(valueEl.value, 10) : undefined,
    target: targetEl ? targetEl.value : undefined,
    extraPoints: extraPointsEl
      ? parseInt(extraPointsEl.value, 10) || 0
      : undefined,
  };
}

// getItems is read live each call (not cached) so the ownership-guard fallback for
// entry-level formKeys sees current state. render is zero-arg — each type passes an
// already-bound callback (e.g. `() => _renderAccessoryLists(state.sheet)`).
export function createEnchantmentsHandlers({
  findByInstanceId,
  getItems,
  getEnchantments = (item) => item.enchantments,
  addEnchantment,
  updateEnchantment,
  removeEnchantment,
  render,
  runWithOpenState = (e, fn) => fn(),
}) {
  function ownsFormKey(formKey) {
    if (findByInstanceId(formKey)) return true;
    return getItems().some((item) =>
      (getEnchantments(item) || []).some((entry) => entry._instanceId === formKey),
    );
  }

  function handleClick(e) {
    if (e.target.classList.contains("enchantment-remove-btn")) {
      const instanceId = e.target.dataset.instanceId;
      const entryInstanceId = e.target.dataset.entryInstanceId;
      if (!findByInstanceId(instanceId)) return false;

      // Drop any in-progress edit-form selection for this entry — its
      // _instanceId won't be reused, but there's no reason to keep it around.
      clearEnchantmentAddFormSelection(entryInstanceId);

      runWithOpenState(e, () => {
        removeEnchantment(instanceId, entryInstanceId);
      });
      return true;
    }

    if (e.target.classList.contains("enchantment-add-btn")) {
      const instanceId = e.target.dataset.instanceId;
      if (!findByInstanceId(instanceId)) return false;

      const params = readEnchantmentFormParams(instanceId);
      if (!params) return true;

      runWithOpenState(e, () => {
        addEnchantment(instanceId, params.enchantmentId, params);
      });
      return true;
    }

    if (e.target.classList.contains("enchantment-save-btn")) {
      const instanceId = e.target.dataset.instanceId;
      const entryInstanceId = e.target.dataset.entryInstanceId;
      if (!findByInstanceId(instanceId)) return false;

      const params = readEnchantmentFormParams(entryInstanceId);
      if (!params) return true;

      // Reset so the next time this entry is expanded, its type-select
      // starts fresh from whatever just got saved, not the pre-save choice.
      clearEnchantmentAddFormSelection(entryInstanceId);

      runWithOpenState(e, () => {
        updateEnchantment(instanceId, entryInstanceId, params.enchantmentId, params);
      });
      return true;
    }

    return false;
  }

  function handleChange(e) {
    if (e.target.classList.contains("enchantment-category-filter")) {
      const formKey = e.target.dataset.formKey;
      if (!formKey || !ownsFormKey(formKey)) return false;

      setEnchantmentAddFormTypeFilter(formKey, e.target.value);

      // Re-render so "Tipo de Encantamento" narrows to the chosen category —
      // same cascading-filter pattern as enchantment-target-filter below,
      // one level up.
      runWithOpenState(e, render);
      return true;
    }

    if (e.target.classList.contains("enchantment-type-select")) {
      const formKey = e.target.dataset.formKey;
      if (!formKey || !ownsFormKey(formKey)) return false;

      setEnchantmentAddFormSelection(formKey, e.target.value);

      // Re-render so the params markup (value input vs. target select vs.
      // target+extraPoints) switches to match the newly chosen effect_type.
      runWithOpenState(e, render);
      return true;
    }

    if (e.target.classList.contains("enchantment-target-filter")) {
      const formKey = e.target.dataset.formKey;
      if (!formKey || !ownsFormKey(formKey)) return false;

      setEnchantmentAddFormTargetFilter(formKey, e.target.value);

      // Re-render so the target select narrows to the chosen
      // type/category/school — same cascading-filter pattern used
      // elsewhere in the app for adding advantages/skills/spells directly.
      runWithOpenState(e, render);
      return true;
    }

    return false;
  }

  return { ownsFormKey, handleClick, handleChange };
}
