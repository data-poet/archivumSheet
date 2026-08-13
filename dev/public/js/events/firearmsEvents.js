import { state } from "../state.js";
import { renderListsPreserving } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipFirearm, moveFirearm, removeFirearm, findFirearmByInstanceId,
  reloadFirearm, computeFinalMagazineSize,
  addEquippedFirearm, addStoredFirearm, saveFirearmCustomFields,
} from "../inventory/firearms.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { tableRowKeyFn, divBlockKeyFn } from "../shared/openState.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../ui/lists/renderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Open-state helpers ─────────────────────────────────────────────────────
// Firearms have their own dedicated tab, with its own containers.

function _snapshot() {
  return {
    slots:   _snap("#firearmSlots",       divBlockKeyFn("data-instance-id")),
    storage: _snap("#firearmStorageList", tableRowKeyFn("data-instance-id")),
  };
}
function _snap(sel, keyFn) {
  const open = new Set();
  document.querySelector(sel)?.querySelectorAll("details[open]").forEach((d) => {
    const k = keyFn(d); if (k) open.add(k);
  });
  return open;
}
function _restore(snap) {
  _rest("#firearmSlots",       divBlockKeyFn("data-instance-id"), snap.slots);
  _rest("#firearmStorageList", tableRowKeyFn("data-instance-id"), snap.storage);
}
function _rest(sel, keyFn, open) {
  if (!open.size) return;
  document.querySelector(sel)?.querySelectorAll("details").forEach((d) => {
    const k = keyFn(d); if (k && open.has(k)) d.setAttribute("open", "");
  });
}
function _renderAll() {
  const snap = _snapshot(); renderListsPreserving(selected, data); _restore(snap);
}

let _deferTimer = null;
function _deferRender() {
  const snap = _snapshot();
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => { renderListsPreserving(selected, data); _restore(snap); }, 300);
}

function _updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}

/** Resume page HP cell: the "actual" value sits in a dedicated <strong> in the <td>. */
function _updateResumeHpDisplay(inputEl, maxHp, modifier) {
  const cell = inputEl.closest("td");
  if (!cell) return;
  const actual = cell.querySelector(".resume-hp-actual");
  if (actual) actual.textContent = maxHp + (modifier || 0);
}

/** Same idea as _updateActualHpDisplay but for the single-value statModifierBlock. */
function _updateActualStatDisplay(inputEl, baseValue, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strong = block.querySelector("strong");
  if (strong) strong.textContent = (Number(baseValue) || 0) + (Number(modifier) || 0);
}

// Maps tuning input CSS classes to instance fields + the weapon DB base field.
const TUNING_FIELDS = {
  "equipped-firearm-gdp":            { field: "gdp_modifier",            base: "weapon_gdp_modifier" },
  "stored-firearm-gdp":              { field: "gdp_modifier",            base: "weapon_gdp_modifier" },
  "equipped-firearm-tr":             { field: "tr_modifier",             base: "weapon_tr" },
  "stored-firearm-tr":               { field: "tr_modifier",             base: "weapon_tr" },
  "equipped-firearm-prec":           { field: "prec_modifier",           base: "weapon_prec" },
  "stored-firearm-prec":             { field: "prec_modifier",           base: "weapon_prec" },
  "equipped-firearm-magazine-mod":   { field: "magazine_size_modifier",  base: "weapon_magazine_size" },
  "stored-firearm-magazine-mod":     { field: "magazine_size_modifier",  base: "weapon_magazine_size" },
};

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleFirearmClick(e) {
  if (e.target.classList.contains("remove-firearm")) {
    removeFirearm(e.target.dataset.instanceId); return true;
  }

  if (e.target.classList.contains("remove-equipped-firearm")) {
    removeFirearm(e.target.dataset.instanceId); return true;
  }

  if (e.target.classList.contains("equip-stored-firearm")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmToEquip = findFirearmByInstanceId(instanceId);
    if (!firearmToEquip) return true;
    equipFirearm(instanceId, firearmToEquip.weapon_id, firearmToEquip.material_id || null);
    return true;
  }

  if (e.target.classList.contains("reload-firearm") || e.target.classList.contains("resume-reload-firearm")) {
    reloadFirearm(e.target.dataset.instanceId); return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findFirearmByInstanceId(instanceId)) return false;
    openCustomFieldsEditor(instanceId);
    _renderAll();
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findFirearmByInstanceId(instanceId)) return false;
    closeCustomFieldsEditor(instanceId);
    _renderAll();
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findFirearmByInstanceId(instanceId)) return false;
    const values = readCustomFieldsEditorValues(instanceId);
    closeCustomFieldsEditor(instanceId);
    if (values) {
      const snap = _snapshot();
      saveFirearmCustomFields(instanceId, values); // mutates + renders + runs engine
      _restore(snap);
    } else {
      _renderAll();
    }
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleFirearmInput(e) {
  if (e.target.classList.contains("resume-firearm-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (/^-$/.test(e.target.value)) return true;
    const weaponData = data.firearms.find((w) => w.weapon_id === firearmInstance.weapon_id);
    const { maxHp } = resolveHp(firearmInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
    firearmInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, firearmInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("resume-firearm-rounds")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (e.target.value === "") return true;
    const weaponData = data.firearms.find((w) => w.weapon_id === firearmInstance.weapon_id);
    const max = computeFinalMagazineSize(firearmInstance, weaponData);
    const parsed = parseInt(e.target.value, 10);
    firearmInstance.rounds_loaded = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), max);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-firearm-hp") || e.target.classList.contains("stored-firearm-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.firearms.find((w) => w.weapon_id === firearmInstance.weapon_id);
    const { maxHp } = resolveHp(firearmInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
    firearmInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, firearmInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-firearm-rounds") || e.target.classList.contains("stored-firearm-rounds")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (e.target.value === "") return true;

    const weaponData = data.firearms.find((w) => w.weapon_id === firearmInstance.weapon_id);
    const max = computeFinalMagazineSize(firearmInstance, weaponData);
    const parsed = parseInt(e.target.value, 10);
    firearmInstance.rounds_loaded = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), max);

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

    const weaponData = data.firearms.find((w) => w.weapon_id === firearmInstance.weapon_id);
    _updateActualStatDisplay(e.target, weaponData?.[base] ?? 0, firearmInstance[field]);

    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleFirearmChange(e) {
  if (e.target.classList.contains("equipped-firearm-name")) {
    const instanceId = e.target.dataset.instanceId;
    const name = e.target.value;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    const availableFirearms = data.firearms.filter((w) => w.weapon_name === name);
    const firstFirearm = availableFirearms[0];
    if (!firstFirearm) return true;
    const tierSelect = document.querySelector(`.equipped-firearm-tier[data-instance-id="${instanceId}"]`);
    if (tierSelect) {
      tierSelect.innerHTML = availableFirearms
        .map((w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`).join("");
    }
    firearmInstance.weapon_id = firstFirearm.weapon_id;
    firearmInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-firearm-tier")) {
    const instanceId = e.target.dataset.instanceId;
    const tier = e.target.value;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    const nameEl = document.querySelector(`.equipped-firearm-name[data-instance-id="${instanceId}"]`);
    if (!nameEl) return true;
    const weapon = data.firearms.find(
      (w) => w.weapon_name === nameEl.value && w.weapon_tier === tier,
    );
    if (!weapon) return true;
    firearmInstance.weapon_id = weapon.weapon_id;
    firearmInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-firearm-material")) {
    const instanceId = e.target.dataset.instanceId;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    firearmInstance.material_id = e.target.value;
    firearmInstance.hit_points_modifier = 0;
    _renderAll();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("firearm-storage-select")) {
    moveFirearm(e.target.dataset.instanceId, e.target.value); return true;
  }

  if (e.target.classList.contains("equipped-firearm-move")) {
    const instanceId = e.target.dataset.instanceId;
    const destination = e.target.value;
    const firearmInstance = findFirearmByInstanceId(instanceId);
    if (!firearmInstance) return true;
    if (!destination) { firearmInstance.is_equipped = true; firearmInstance.storedAt = null; }
    else { firearmInstance.is_equipped = false; firearmInstance.storedAt = destination; }
    _renderAll();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add form ─────────────────────────────────────────────────────────────────

export function handleAddFirearm() {
  const nameEl     = document.getElementById("firearmNameSelect");
  const tierEl     = document.getElementById("firearmTierSelect");
  const materialEl = document.getElementById("firearmMaterialSelect");
  const storageEl  = document.getElementById("firearmStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;

  const firearm = data.firearms.find(
    (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
  );
  if (!firearm) return;

  const material = data.materials.find((m) => m.material_name === materialEl.value);
  const materialId = material?.material_id ?? null;

  if (storageEl.value === "equipped") addEquippedFirearm(firearm.weapon_id, materialId);
  else addStoredFirearm(firearm.weapon_id, materialId, storageEl.value);
}
