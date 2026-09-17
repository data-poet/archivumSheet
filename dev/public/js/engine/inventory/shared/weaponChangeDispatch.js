// Shared factory for the name / tier / material / storage / move "change" branches
// of the three weapon types (melee, ranged, firearms), previously copy-pasted
// byte-for-byte apart from the class prefix and which catalog they read.
//
// Armor and shield deliberately do NOT use this: armor addresses its equipped rows
// by body slot and shield has only one equippable instance, so both carry extra
// equip/unequip fallbacks that don't generalize.

import { triggerAutoRun } from "../../../compute/autorun.js";

// onMoved runs after is_equipped/storedAt are written — melee and ranged use it to
// mirror the move onto a dual-use counterpart.
export function createWeaponChangeHandler({
  classPrefix,
  catalog,
  findByInstanceId,
  move,
  renderAfterMaterial,
  renderAfterMove,
  onMoved = () => {},
}) {
  const NAME = `equipped-${classPrefix}-name`;
  const TIER = `equipped-${classPrefix}-tier`;
  const MATERIAL = `equipped-${classPrefix}-material`;
  const STORAGE = `${classPrefix}-storage-select`;
  const MOVE = `equipped-${classPrefix}-move`;

  return function handleWeaponChange(e) {
    if (e.target.classList.contains(NAME)) {
      const instanceId = e.target.dataset.instanceId;
      const instance = findByInstanceId(instanceId);
      if (!instance) return true;

      const available = catalog().filter(
        (w) => w.weapon_name === e.target.value,
      );
      const first = available[0];
      if (!first) return true;

      // Re-narrow the sibling tier select to the tiers this name actually has.
      const tierSelect = document.querySelector(
        `.${TIER}[data-instance-id="${instanceId}"]`,
      );
      if (tierSelect) {
        tierSelect.innerHTML = available
          .map(
            (w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`,
          )
          .join("");
      }

      instance.weapon_id = first.weapon_id;
      instance.hit_points_modifier = 0;
      triggerAutoRun();
      return true;
    }

    if (e.target.classList.contains(TIER)) {
      const instanceId = e.target.dataset.instanceId;
      const instance = findByInstanceId(instanceId);
      if (!instance) return true;

      const nameEl = document.querySelector(
        `.${NAME}[data-instance-id="${instanceId}"]`,
      );
      if (!nameEl) return true;

      const weapon = catalog().find(
        (w) =>
          w.weapon_name === nameEl.value && w.weapon_tier === e.target.value,
      );
      if (!weapon) return true;

      instance.weapon_id = weapon.weapon_id;
      instance.hit_points_modifier = 0;
      triggerAutoRun();
      return true;
    }

    if (e.target.classList.contains(MATERIAL)) {
      const instance = findByInstanceId(e.target.dataset.instanceId);
      if (!instance) return true;

      instance.material_id = e.target.value;
      instance.hit_points_modifier = 0;
      renderAfterMaterial();
      triggerAutoRun();
      return true;
    }

    if (e.target.classList.contains(STORAGE)) {
      move(e.target.dataset.instanceId, e.target.value);
      return true;
    }

    if (e.target.classList.contains(MOVE)) {
      const instance = findByInstanceId(e.target.dataset.instanceId);
      if (!instance) return true;

      const destination = e.target.value;
      instance.is_equipped = !destination;
      instance.storedAt = destination || null;

      onMoved(instance);
      renderAfterMove();
      triggerAutoRun();
      return true;
    }

    return false;
  };
}
