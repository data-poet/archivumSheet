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

const data = state.data;
const selected = state.selected;

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
    }
  });
}
