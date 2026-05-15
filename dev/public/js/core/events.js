import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "./autorun.js";
import { runEngine } from "./engine.js";

import { loadAdvantages, addAdv, removeAdv } from "./traits/advantages.js";
import {
  loadDisadvantages,
  addDis,
  removeDis,
} from "./traits/disadvantages.js";
import {
  loadSkills,
  addSkill,
  removeSkill,
  updateSkill,
} from "./skills/skills.js";
import {
  loadSpells,
  addSpell,
  removeSpell,
  updateSpell,
} from "./magic/spells.js";
import {
  loadArmors,
  updateArmorNameOptions,
  updateArmorTierOptions,
  equipArmor,
  addStoredArmor,
  moveArmor,
  removeArmor,
} from "./inventory/armors.js";
import {
  loadShields,
  updateShieldNameOptions,
  updateShieldTierOptions,
  equipShield,
  addStoredShield,
  moveShield,
  removeShield,
} from "./inventory/shields.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getArmorMaxHp(armorInstance, armorData) {
  const material = armorInstance?.material_id
    ? data.materials.find((m) => m.material_id === armorInstance.material_id)
    : null;

  return material
    ? Number(armorData?.armor_hit_points || 0) *
        Number(material.material_hit_points_modifier || 1)
    : Number(armorData?.armor_hit_points || 0);
}

function getShieldMaxHp(shieldInstance, shieldData) {
  const material = shieldInstance?.material_id
    ? data.materials.find((m) => m.material_id === shieldInstance.material_id)
    : null;

  return material
    ? Number(shieldData?.shield_hit_points || 0) *
        Number(material.material_hit_points_modifier || 1)
    : Number(shieldData?.shield_hit_points || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BIND UI
// ─────────────────────────────────────────────────────────────────────────────

export function bindUI() {
  // ── Advantages ────────────────────────────────────────────────────────────
  document
    .getElementById("loadAdvantagesBtn")
    .addEventListener("click", loadAdvantages);
  document.getElementById("addAdvBtn").addEventListener("click", addAdv);

  // ── Disadvantages ─────────────────────────────────────────────────────────
  document
    .getElementById("loadDisadvantagesBtn")
    .addEventListener("click", loadDisadvantages);
  document.getElementById("addDisBtn").addEventListener("click", addDis);

  // ── Skills ────────────────────────────────────────────────────────────────
  document
    .getElementById("loadSkillsBtn")
    .addEventListener("click", loadSkills);
  document.getElementById("addSkillBtn").addEventListener("click", addSkill);

  // ── Spells ────────────────────────────────────────────────────────────────
  document
    .getElementById("loadSpellsBtn")
    .addEventListener("click", loadSpells);
  document.getElementById("addSpellBtn").addEventListener("click", addSpell);

  // ── Armors ────────────────────────────────────────────────────────────────
  document
    .getElementById("loadArmorsBtn")
    .addEventListener("click", loadArmors);
  document
    .getElementById("armorSlotSelect")
    .addEventListener("change", updateArmorNameOptions);
  document
    .getElementById("armorNameSelect")
    .addEventListener("change", updateArmorTierOptions);

  document.getElementById("addArmorBtn").addEventListener("click", () => {
    const slot = document.getElementById("armorSlotSelect").value;
    const name = document.getElementById("armorNameSelect").value;
    const tier = document.getElementById("armorTierSelect").value;

    const armor = data.armors.find(
      (a) =>
        a.armor_piece_location === slot &&
        a.armor_name === name &&
        a.armor_tier === tier,
    );

    if (!armor) return;

    const materialName = document.getElementById("armorMaterialSelect").value;
    const material = data.materials.find(
      (m) => m.material_name === materialName,
    );
    const materialId = material?.material_id || null;
    const storedAt = document.getElementById("armorStorage").value;

    addStoredArmor(armor.armor_id, materialId, storedAt);
  });

  // ── Shields ───────────────────────────────────────────────────────────────
  document
    .getElementById("loadShieldsBtn")
    .addEventListener("click", loadShields);
  document
    .getElementById("shieldNameSelect")
    .addEventListener("change", updateShieldNameOptions);
  document
    .getElementById("shieldTierSelect")
    .addEventListener("change", updateShieldTierOptions);

  document.getElementById("addShieldBtn").addEventListener("click", () => {
    const name = document.getElementById("shieldNameSelect").value;
    const tier = document.getElementById("shieldTierSelect").value;

    const shield = data.shields.find(
      (s) => s.shield_name === name && s.shield_tier === tier,
    );

    if (!shield) return;

    const materialName = document.getElementById("shieldMaterialSelect").value;
    const material = data.materials.find(
      (m) => m.material_name === materialName,
    );
    const materialId = material?.material_id || null;
    const storedAt = document.getElementById("shieldStorage").value;

    addStoredShield(shield.shield_id, materialId, storedAt);
  });

  // ── Engine ────────────────────────────────────────────────────────────────
  document.getElementById("runEngineBtn").addEventListener("click", runEngine);

  // ── Click delegation ──────────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-adv")) {
      removeAdv(e.target.dataset.id);
      return;
    }

    if (e.target.classList.contains("remove-dis")) {
      removeDis(e.target.dataset.id);
      return;
    }

    if (e.target.classList.contains("remove-skill")) {
      removeSkill(e.target.dataset.id);
      return;
    }

    if (e.target.classList.contains("remove-spell")) {
      removeSpell(e.target.dataset.name);
      return;
    }

    if (e.target.classList.contains("remove-armor")) {
      removeArmor(Number(e.target.dataset.index));
      return;
    }

    if (e.target.classList.contains("equip-stored-armor")) {
      const index = Number(e.target.dataset.index);
      const armorToEquip = selected.armors[index];
      if (!armorToEquip) return;

      const dbArmor = data.armors.find(
        (a) => a.armor_id === armorToEquip.armor_id,
      );
      if (!dbArmor) return;

      const slot = dbArmor.armor_piece_location;

      // Unequip whatever is currently in this slot
      selected.armors.forEach((armorInstance) => {
        if (!armorInstance.is_equipped) return;

        const equippedDb = data.armors.find(
          (a) => a.armor_id === armorInstance.armor_id,
        );

        if (equippedDb?.armor_piece_location === slot) {
          armorInstance.is_equipped = false;
          armorInstance.storedAt = "backpack";
        }
      });

      armorToEquip.is_equipped = true;
      armorToEquip.storedAt = null;

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("remove-shield")) {
      removeShield(Number(e.target.dataset.index));
      return;
    }

    if (e.target.classList.contains("equip-stored-shield")) {
      const index = Number(e.target.dataset.index);
      const shieldToEquip = selected.shields[index];
      if (!shieldToEquip) return;

      // Unequip whatever shield is currently equipped
      selected.shields.forEach((shieldInstance) => {
        if (!shieldInstance.is_equipped) return;
        shieldInstance.is_equipped = false;
        shieldInstance.storedAt = "backpack";
      });

      shieldToEquip.is_equipped = true;
      shieldToEquip.storedAt = null;

      renderLists(selected, data);
      triggerAutoRun();
    }
  });

  // ── Input delegation ──────────────────────────────────────────────────────
  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("skill-input")) {
      updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
      return;
    }

    if (e.target.classList.contains("spell-input")) {
      updateSpell(
        e.target.dataset.name,
        e.target.dataset.field,
        e.target.value,
      );
      return;
    }

    if (e.target.classList.contains("equipped-armor-hp")) {
      const slot = e.target.dataset.slot;

      const equippedArmor = selected.armors.find((sa) => {
        if (!sa.is_equipped) return false;
        const db = data.armors.find((a) => a.armor_id === sa.armor_id);
        return db?.armor_piece_location === slot;
      });

      if (!equippedArmor) return;

      const armorData = data.armors.find(
        (a) => a.armor_id === equippedArmor.armor_id,
      );

      // Use material-adjusted max HP for the clamp, not raw base HP
      const maxHp = getArmorMaxHp(equippedArmor, armorData);
      const min = maxHp * -1;
      const max = 0;

      equippedArmor.hit_points_modifier = Math.max(
        min,
        Math.min(max, Number(e.target.value) || 0),
      );

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("stored-armor-hp")) {
      const index = Number(e.target.dataset.index);
      const armorInstance = selected.armors[index];
      if (!armorInstance) return;

      const armorData = data.armors.find(
        (a) => a.armor_id === armorInstance.armor_id,
      );

      // Use material-adjusted max HP for the clamp, not raw base HP
      const maxHp = getArmorMaxHp(armorInstance, armorData);
      const min = maxHp * -1;
      const max = 0;

      armorInstance.hit_points_modifier = Math.max(
        min,
        Math.min(max, Number(e.target.value) || 0),
      );

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("equipped-shield-hp")) {
      const equippedShield = selected.shields.find((ss) => ss.is_equipped);
      if (!equippedShield) return;

      const shieldData = data.shields.find(
        (s) => s.shield_id === equippedShield.shield_id,
      );

      // Use material-adjusted max HP for the clamp, not raw base HP
      const maxHp = getShieldMaxHp(equippedShield, shieldData);
      const min = maxHp * -1;
      const max = 0;

      equippedShield.hit_points_modifier = Math.max(
        min,
        Math.min(max, Number(e.target.value) || 0),
      );

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("stored-shield-hp")) {
      const index = Number(e.target.dataset.index);
      const shieldInstance = selected.shields[index];
      if (!shieldInstance) return;

      const shieldData = data.shields.find(
        (s) => s.shield_id === shieldInstance.shield_id,
      );

      // Use material-adjusted max HP for the clamp, not raw base HP
      const maxHp = getShieldMaxHp(shieldInstance, shieldData);
      const min = maxHp * -1;
      const max = 0;

      shieldInstance.hit_points_modifier = Math.max(
        min,
        Math.min(max, Number(e.target.value) || 0),
      );

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("secondary-input")) {
      const { name, field } = e.target.dataset;
      const value = Number(e.target.value) || 0;

      if (!selected.secondary[name]) {
        selected.secondary[name] = { bought: 0, modifier: 0 };
      }

      if (field === "bought") {
        const max = name === "BasicSpeed" ? 6 : 5;
        selected.secondary[name].bought = Math.max(0, Math.min(max, value));
      }

      if (field === "modifier") {
        selected.secondary[name].modifier =
          name === "BasicSpeed" ? Math.round(value * 2) / 2 : value;
      }

      triggerAutoRun();
      return;
    }

    if (e.target.classList.contains("damage-input")) {
      const { type } = e.target.dataset;
      const value = Number(e.target.value) || 0;

      if (!selected.damage[type]) {
        selected.damage[type] = { modifier: 0 };
      }

      selected.damage[type].modifier = value;
      triggerAutoRun();
    }
  });

  // ── Change delegation ─────────────────────────────────────────────────────
  document.addEventListener("change", (e) => {
    // Equipped armor — name changed
    if (e.target.classList.contains("equipped-armor-name")) {
      const slot = e.target.dataset.slot;
      const name = e.target.value;

      if (!name) {
        equipArmor(slot, "");
        return;
      }

      const tierSelect = document.querySelector(
        `.equipped-armor-tier[data-slot="${slot}"]`,
      );
      const availableArmors = data.armors.filter(
        (a) => a.armor_piece_location === slot && a.armor_name === name,
      );

      tierSelect.innerHTML = availableArmors
        .map((a) => `<option value="${a.armor_tier}">${a.armor_tier}</option>`)
        .join("");

      const firstArmor = availableArmors[0];
      if (!firstArmor) return;

      equipArmor(slot, firstArmor.armor_id, "MAT-000");
      renderLists(selected, data);
      return;
    }

    // Equipped armor — tier changed
    if (e.target.classList.contains("equipped-armor-tier")) {
      const slot = e.target.dataset.slot;
      const tier = e.target.value;
      const name = document.querySelector(
        `.equipped-armor-name[data-slot="${slot}"]`,
      ).value;

      const armor = data.armors.find(
        (a) =>
          a.armor_piece_location === slot &&
          a.armor_name === name &&
          a.armor_tier === tier,
      );

      if (!armor) return;

      const currentEquipped = selected.armors.find((sa) => {
        if (!sa.is_equipped) return false;
        const db = data.armors.find((a) => a.armor_id === sa.armor_id);
        return db?.armor_piece_location === slot;
      });

      equipArmor(
        slot,
        armor.armor_id,
        currentEquipped?.material_id || "MAT-000",
      );
      return;
    }

    // Equipped armor — material changed
    if (e.target.classList.contains("equipped-armor-material")) {
      const slot = e.target.dataset.slot;
      const materialId = e.target.value;

      const equippedArmor = selected.armors.find((sa) => {
        if (!sa.is_equipped) return false;
        const db = data.armors.find((a) => a.armor_id === sa.armor_id);
        return db?.armor_piece_location === slot;
      });

      if (!equippedArmor) return;

      equippedArmor.material_id = materialId;

      // Reset modifier when material changes — old clamp range is now invalid
      equippedArmor.hit_points_modifier = 0;

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    // Stored armor — storage location changed
    if (e.target.classList.contains("armor-storage-select")) {
      moveArmor(Number(e.target.dataset.index), e.target.value);
      return;
    }

    // Equipped armor — moved to storage
    if (e.target.classList.contains("equipped-armor-move")) {
      const slot = e.target.dataset.slot;
      const destination = e.target.value;

      const equippedArmor = selected.armors.find((sa) => {
        if (!sa.is_equipped) return false;
        const db = data.armors.find((a) => a.armor_id === sa.armor_id);
        return db?.armor_piece_location === slot;
      });

      if (!equippedArmor) return;

      if (!destination) {
        equippedArmor.is_equipped = true;
        equippedArmor.storedAt = null;
      } else {
        equippedArmor.is_equipped = false;
        equippedArmor.storedAt = destination;
      }

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    // Equipped shield — name changed
    if (e.target.classList.contains("equipped-shield-name")) {
      const name = e.target.value;

      if (!name) {
        equipShield("");
        return;
      }

      const tierSelect = document.querySelector(".equipped-shield-tier");
      const availableShields = data.shields.filter(
        (s) => s.shield_name === name,
      );

      tierSelect.innerHTML = availableShields
        .map(
          (s) => `<option value="${s.shield_tier}">${s.shield_tier}</option>`,
        )
        .join("");

      const firstShield = availableShields[0];
      if (!firstShield) return;

      equipShield(firstShield.shield_id, "MAT-000");
      renderLists(selected, data);
      return;
    }

    // Equipped shield — tier changed
    if (e.target.classList.contains("equipped-shield-tier")) {
      const tier = e.target.value;
      const name = document.querySelector(".equipped-shield-name").value;

      const shield = data.shields.find(
        (s) => s.shield_name === name && s.shield_tier === tier,
      );

      if (!shield) return;

      const currentEquipped = selected.shields.find((ss) => ss.is_equipped);

      equipShield(shield.shield_id, currentEquipped?.material_id || "MAT-000");
      return;
    }

    // Equipped shield — material changed
    if (e.target.classList.contains("equipped-shield-material")) {
      const materialId = e.target.value;

      const equippedShield = selected.shields.find((ss) => ss.is_equipped);

      if (!equippedShield) return;

      equippedShield.material_id = materialId;

      // Reset modifier when material changes — old clamp range is now invalid
      equippedShield.hit_points_modifier = 0;

      renderLists(selected, data);
      triggerAutoRun();
      return;
    }

    // Stored shield — storage location changed
    if (e.target.classList.contains("shield-storage-select")) {
      moveShield(Number(e.target.dataset.index), e.target.value);
      return;
    }

    // Equipped shield — moved to storage
    if (e.target.classList.contains("equipped-shield-move")) {
      const destination = e.target.value;

      const equippedShield = selected.shields.find((ss) => ss.is_equipped);

      if (!equippedShield) return;

      if (!destination) {
        equippedShield.is_equipped = true;
        equippedShield.storedAt = null;
      } else {
        equippedShield.is_equipped = false;
        equippedShield.storedAt = destination;
      }

      renderLists(selected, data);
      triggerAutoRun();
    }
  });
}
