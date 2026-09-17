import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import {
  equipShield,
  addStoredShield,
  moveShield,
  removeShield,
  findShieldByInstanceId,
  saveShieldCustomFields,
  addShieldEnchantment,
  updateShieldEnchantment,
  removeShieldEnchantment,
} from "./model.js";
import { renderEquippedShield, renderStoredShields } from "./render.js";
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

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _renderShieldLists = createListRenderer(
  renderEquippedShield,
  renderStoredShields,
);

const _deferRender = createDeferredRender(() => _renderShieldLists());

const _handleShieldCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findShieldByInstanceId,
  saveCustomFields: withPreservedOpenState(saveShieldCustomFields),
  render: _renderShieldLists,
});

// The enchantment mutators already snapshot+restore synchronously, so runWithOpenState stays
// at its no-op default. The change-path uses _renderShieldLists, which self-wraps via rAF.
const _shieldEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findShieldByInstanceId,
  getItems: () => selected.shields,
  addEnchantment: addShieldEnchantment,
  updateEnchantment: updateShieldEnchantment,
  removeEnchantment: removeShieldEnchantment,
  render: () => _renderShieldLists(state.sheet),
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleShieldClick(e) {
  if (e.target.classList.contains("remove-shield")) {
    removeShield(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("remove-equipped-shield")) {
    removeShield(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-shield")) {
    const instanceId = e.target.dataset.instanceId;
    const shieldToEquip = findShieldByInstanceId(instanceId);
    if (!shieldToEquip) return true;
    selected.shields.forEach((inst) => {
      if (!inst.is_equipped) return;
      inst.is_equipped = false;
      inst.storedAt = "backpack";
    });
    shieldToEquip.is_equipped = true;
    shieldToEquip.storedAt = null;
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  // Delegated to the shared factory — see armorEvents.js for the full rationale.
  if (_handleShieldCustomFieldsClick(e)) return true;

  if (_shieldEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

// Only one shield can be equipped at a time, so the equipped rows don't need an id
// to address — "the equipped shield" is unambiguous.
export const handleShieldInput = createHpInputHandler({
  variants: [
    {
      cssClass: "resume-shield-hp",
      findInstance: () => selected.shields.find((s) => s.is_equipped),
      display: updateResumeHpDisplay,
    },
    {
      cssClass: "equipped-shield-hp",
      findInstance: () => selected.shields.find((s) => s.is_equipped),
      display: updateActualHpDisplay,
    },
    {
      cssClass: "stored-shield-hp",
      findInstance: (el) => findShieldByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
  ],
  catalog: () => data.shields,
  catalogIdField: "shield_id",
  baseHpField: "shield_hit_points",
  deferRender: _deferRender,
});

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleShieldChange(e) {
  if (e.target.classList.contains("equipped-shield-name")) {
    const name = e.target.value;
    if (!name) {
      equipShield("");
      return true;
    }
    const availableShields = data.shields.filter((s) => s.shield_name === name);
    const firstShield = availableShields[0];
    if (!firstShield) return true;
    const tierSelect = document.querySelector(".equipped-shield-tier");
    if (tierSelect) {
      tierSelect.innerHTML = availableShields
        .map(
          (s) => `<option value="${s.shield_tier}">${s.shield_tier}</option>`,
        )
        .join("");
    }
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = firstShield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(firstShield.shield_id, "MAT-000");
      return true;
    }
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-tier")) {
    const tier = e.target.value;
    const nameEl = document.querySelector(".equipped-shield-name");
    if (!nameEl) return true;
    const shield = data.shields.find(
      (s) => s.shield_name === nameEl.value && s.shield_tier === tier,
    );
    if (!shield) return true;
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = shield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(shield.shield_id, "MAT-000");
      return true;
    }
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-material")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    equippedShield.material_id = e.target.value;
    equippedShield.hit_points_modifier = 0;
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("shield-storage-select")) {
    moveShield(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("equipped-shield-move")) {
    const destination = e.target.value;
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    if (!destination) {
      equippedShield.is_equipped = true;
      equippedShield.storedAt = null;
    } else {
      equippedShield.is_equipped = false;
      equippedShield.storedAt = destination;
    }
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  if (_shieldEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddShield() {
  const nameEl = document.getElementById("shieldNameSelect");
  const tierEl = document.getElementById("shieldTierSelect");
  const materialEl = document.getElementById("shieldMaterialSelect");
  const storageEl = document.getElementById("shieldStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const shield = data.shields.find(
    (s) => s.shield_name === nameEl.value && s.shield_tier === tierEl.value,
  );
  if (!shield) return;
  const material = data.materials.find(
    (m) => m.material_name === materialEl.value,
  );
  addStoredShield(
    shield.shield_id,
    material?.material_id ?? null,
    storageEl.value,
  );
}
