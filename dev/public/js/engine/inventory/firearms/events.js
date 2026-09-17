import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import {
  equipFirearm,
  moveFirearm,
  removeFirearm,
  findFirearmByInstanceId,
  reloadFirearm,
  computeFinalMagazineSize,
  addEquippedFirearm,
  addStoredFirearm,
  saveFirearmCustomFields,
  addFirearmEnchantment,
  updateFirearmEnchantment,
  removeFirearmEnchantment,
} from "./model.js";
import { renderEquippedFirearms, renderStoredFirearms } from "./render.js";
import {
  createCustomFieldsClickHandler,
  withPreservedOpenState,
} from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import {
  createListRenderer,
  createDeferredRender,
} from "../shared/renderScheduling.js";
import {
  createHpInputHandler,
  updateResumeHpDisplay,
  updateActualHpDisplay,
} from "../shared/durabilityDispatch.js";
import { createWeaponChangeHandler } from "../shared/weaponChangeDispatch.js";
import { createWeaponAddHandler } from "../shared/weaponAddForm.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Firearms have their own dedicated tab, with its own containers.

const _renderFirearmLists = createListRenderer(
  renderEquippedFirearms,
  renderStoredFirearms,
);

const _deferRender = createDeferredRender(() => _renderFirearmLists());

// Same idea as updateActualHpDisplay but for the single-value statModifierBlock.
function _updateActualStatDisplay(inputEl, baseValue, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strong = block.querySelector("strong");
  if (strong)
    strong.textContent = (Number(baseValue) || 0) + (Number(modifier) || 0);
}

const _handleFirearmCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findFirearmByInstanceId,
  saveCustomFields: withPreservedOpenState(saveFirearmCustomFields),
  render: _renderFirearmLists,
});

// Enchantment mutators self-wrap render+snapshot/restore, so runWithOpenState stays at its no-op default (same as melee/ranged).
// No dual-use counterpart for firearms, so the render here is firearm-only, unlike melee/ranged's combined re-render.
const _firearmEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findFirearmByInstanceId,
  getItems: () => selected.firearms,
  addEnchantment: addFirearmEnchantment,
  updateEnchantment: updateFirearmEnchantment,
  removeEnchantment: removeFirearmEnchantment,
  render: () => _renderFirearmLists(state.sheet),
});

const TUNING_FIELDS = {
  "equipped-firearm-gdp": {
    field: "gdp_modifier",
    base: "weapon_gdp_modifier",
  },
  "stored-firearm-gdp": { field: "gdp_modifier", base: "weapon_gdp_modifier" },
  "equipped-firearm-tr": { field: "tr_modifier", base: "weapon_tr" },
  "stored-firearm-tr": { field: "tr_modifier", base: "weapon_tr" },
  "equipped-firearm-prec": { field: "prec_modifier", base: "weapon_prec" },
  "stored-firearm-prec": { field: "prec_modifier", base: "weapon_prec" },
  "equipped-firearm-magazine-mod": {
    field: "magazine_size_modifier",
    base: "weapon_magazine_size",
  },
  "stored-firearm-magazine-mod": {
    field: "magazine_size_modifier",
    base: "weapon_magazine_size",
  },
};

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleFirearmClick(e) {
  if (e.target.classList.contains("remove-firearm")) {
    removeFirearm(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("remove-equipped-firearm")) {
    removeFirearm(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-firearm")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmToEquip = findFirearmByInstanceId(instanceId);
    if (!firearmToEquip) return true;
    equipFirearm(
      instanceId,
      firearmToEquip.weapon_id,
      firearmToEquip.material_id || null,
    );
    return true;
  }

  if (
    e.target.classList.contains("reload-firearm") ||
    e.target.classList.contains("resume-reload-firearm")
  ) {
    reloadFirearm(e.target.dataset.instanceId);
    return true;
  }

  // Delegated to the shared factory — see armorEvents.js for the full rationale.
  if (_handleFirearmCustomFieldsClick(e)) return true;

  if (_firearmEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

const _handleFirearmHpInput = createHpInputHandler({
  variants: [
    {
      cssClass: "resume-firearm-hp",
      findInstance: (el) => findFirearmByInstanceId(el.dataset.instanceId),
      display: updateResumeHpDisplay,
    },
    {
      cssClass: "equipped-firearm-hp",
      findInstance: (el) => findFirearmByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
    {
      cssClass: "stored-firearm-hp",
      findInstance: (el) => findFirearmByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
  ],
  catalog: () => data.firearms,
  catalogIdField: "weapon_id",
  baseHpField: "weapon_hit_points",
  deferRender: _deferRender,
});

// The resume, equipped and stored rounds inputs all clamp to the same magazine
// size, so they share one branch.
const ROUNDS_CLASSES = [
  "resume-firearm-rounds",
  "equipped-firearm-rounds",
  "stored-firearm-rounds",
];

export function handleFirearmInput(e) {
  if (_handleFirearmHpInput(e)) return true;

  if (ROUNDS_CLASSES.some((cls) => e.target.classList.contains(cls))) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (e.target.value === "") return true;

    const weaponData = data.firearms.find(
      (w) => w.weapon_id === firearmInstance.weapon_id,
    );
    const max = computeFinalMagazineSize(firearmInstance, weaponData);
    const parsed = parseInt(e.target.value, 10);
    firearmInstance.rounds_loaded = Math.min(
      Math.max(isNaN(parsed) ? 0 : parsed, 0),
      max,
    );

    _deferRender();
    triggerAutoRun();
    return true;
  }

  for (const [cssClass, { field, base }] of Object.entries(TUNING_FIELDS)) {
    if (!e.target.classList.contains(cssClass)) continue;

    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (e.target.value === "-" || e.target.value === "") return true; // allow mid-typing

    const parsed = parseInt(e.target.value, 10);
    firearmInstance[field] = isNaN(parsed) ? 0 : parsed;

    const weaponData = data.firearms.find(
      (w) => w.weapon_id === firearmInstance.weapon_id,
    );
    _updateActualStatDisplay(
      e.target,
      weaponData?.[base] ?? 0,
      firearmInstance[field],
    );

    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

// No dual-use counterpart for firearms, so no onMoved mirror and both renders are firearm-only.
const _handleFirearmWeaponChange = createWeaponChangeHandler({
  classPrefix: "firearm",
  catalog: () => data.firearms,
  findByInstanceId: findFirearmByInstanceId,
  move: moveFirearm,
  renderAfterMaterial: () => _renderFirearmLists(),
  renderAfterMove: () => _renderFirearmLists(),
});

export function handleFirearmChange(e) {
  if (_handleFirearmWeaponChange(e)) return true;

  if (_firearmEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add form ─────────────────────────────────────────────────────────────────

export const handleAddFirearm = createWeaponAddHandler({
  idPrefix: "firearm",
  catalog: () => data.firearms,
  addEquipped: addEquippedFirearm,
  addStored: addStoredFirearm,
});
