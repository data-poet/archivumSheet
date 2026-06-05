import { state } from "../state.js";
import {
  addSurvivalGear,
  updateSurvivalGearQuantity,
  removeSurvivalGear,
  updateSurvivalGearTypeOptions,
  updateSurvivalGearNameOptions,
} from "../inventory/survivalGear.js";

const data = state.data;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleSurvivalGearClick(e) {
  if (e.target.classList.contains("remove-survival-gear")) {
    removeSurvivalGear(
      e.target.dataset.gearId,
      e.target.dataset.storedAt,
    );
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleSurvivalGearInput(e) {
  if (e.target.classList.contains("survival-gear-qty")) {
    const gearId = e.target.dataset.gearId;
    const storedAt = e.target.dataset.storedAt;
    const quantity = parseInt(e.target.value, 10);
    if (!gearId || !storedAt) return true;
    updateSurvivalGearQuantity(
      gearId,
      storedAt,
      isNaN(quantity) ? 0 : quantity,
    );
    return true;
  }
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleSurvivalGearChange(e) {
  if (e.target.id === "survivalGearTypeFilter") {
    updateSurvivalGearTypeOptions();
    return true;
  }
  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddSurvivalGear() {
  const typeEl    = document.getElementById("survivalGearTypeFilter");
  const nameEl    = document.getElementById("survivalGearNameSelect");
  const qtyEl     = document.getElementById("survivalGearQty");
  const storageEl = document.getElementById("survivalGearStorage");

  if (!nameEl || !qtyEl || !storageEl) return;

  const typeFilter = typeEl?.value || "";
  const name       = nameEl.value;
  const quantity   = parseInt(qtyEl.value, 10);
  const storedAt   = storageEl.value;

  if (!name || isNaN(quantity) || quantity <= 0) return;

  const gear = data.survivalGear.find(
    (g) =>
      g.adventure_gear_name === name &&
      (!typeFilter || g.adventure_gear_type === typeFilter),
  );

  if (!gear) return;

  addSurvivalGear(gear.adventure_gear_id, quantity, storedAt);
  qtyEl.value = "1";
}
