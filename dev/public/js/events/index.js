import { on } from "../shared/dom.js";
import { runEngine } from "../engine/index.js";
import { loadAdvantages, addAdv } from "../traits/advantages.js";
import { loadDisadvantages, addDis } from "../traits/disadvantages.js";
import { loadSkills, addSkill } from "../traits/skills.js";
import { loadSpells, addSpell } from "../traits/spells.js";
import {
  loadArmors,
  updateArmorNameOptions,
  updateArmorTierOptions,
} from "../inventory/armor.js";
import { loadShields, updateShieldTierOptions } from "../inventory/shield.js";
import {
  loadMeleeWeapons,
  updateMeleeTierOptions,
} from "../inventory/melee.js";
import {
  loadRangedWeapons,
  updateRangedTierOptions,
} from "../inventory/ranged.js";
import { exportSheet, importSheet } from "../store/persistence.js";

import { handleTraitClick, handleTraitInput } from "./traitEvents.js";
import {
  handleArmorClick,
  handleArmorInput,
  handleArmorChange,
  handleAddArmor,
} from "./armorEvents.js";
import {
  handleShieldClick,
  handleShieldInput,
  handleShieldChange,
  handleAddShield,
} from "./shieldEvents.js";
import {
  handleMeleeClick,
  handleMeleeInput,
  handleMeleeChange,
  handleAddMelee,
} from "./meleeEvents.js";
import {
  handleRangedClick,
  handleRangedInput,
  handleRangedChange,
  handleAddRanged,
} from "./rangedEvents.js";

// ─────────────────────────────────────────────────────────────────────────────
// BIND ALL UI LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

export function bindUI() {
  // ── Traits ────────────────────────────────────────────────────────────────
  on("loadAdvantagesBtn", "click", loadAdvantages);
  on("addAdvBtn", "click", addAdv);

  on("loadDisadvantagesBtn", "click", loadDisadvantages);
  on("addDisBtn", "click", addDis);

  on("loadSkillsBtn", "click", loadSkills);
  on("addSkillBtn", "click", addSkill);

  on("loadSpellsBtn", "click", loadSpells);
  on("addSpellBtn", "click", addSpell);

  // ── Armor ─────────────────────────────────────────────────────────────────
  on("loadArmorsBtn", "click", loadArmors);
  on("armorSlotSelect", "change", updateArmorNameOptions);
  on("armorNameSelect", "change", updateArmorTierOptions);
  on("addArmorBtn", "click", handleAddArmor);

  // ── Shields ───────────────────────────────────────────────────────────────
  on("loadShieldsBtn", "click", loadShields);
  on("shieldNameSelect", "change", updateShieldTierOptions);
  on("addShieldBtn", "click", handleAddShield);

  // ── Melee ─────────────────────────────────────────────────────────────────
  on("loadMeleeWeaponsBtn", "click", loadMeleeWeapons);
  on("meleeNameSelect", "change", updateMeleeTierOptions);
  on("addMeleeBtn", "click", handleAddMelee);

  // ── Ranged ─────────────────────────────────────────────────────────────────
  on("loadRangedWeaponsBtn", "click", loadRangedWeapons);
  on("rangedNameSelect", "change", updateRangedTierOptions);
  on("addRangedBtn", "click", handleAddRanged);

  // ── Engine ────────────────────────────────────────────────────────────────
  on("runEngineBtn", "click", runEngine);

  // ── Persistence ───────────────────────────────────────────────────────────
  on("exportSheetBtn", "click", exportSheet);

  on("importSheetBtn", "click", () => {
    document.getElementById("importFileInput")?.click();
  });

  const importFileInput = document.getElementById("importFileInput");
  if (importFileInput) {
    importFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await importSheet(file);
      } catch (err) {
        alert(`Import error: ${err.message}`);
      } finally {
        // Reset so the same file can be re-imported if needed
        importFileInput.value = "";
      }
    });
  }

  // ── Global delegated click ────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    if (handleTraitClick(e)) return;
    if (handleArmorClick(e)) return;
    if (handleShieldClick(e)) return;
    if (handleMeleeClick(e)) return;
    if (handleRangedClick(e)) return;
  });

  // ── Global delegated input ────────────────────────────────────────────────
  document.addEventListener("input", (e) => {
    if (handleTraitInput(e)) return;
    if (handleArmorInput(e)) return;
    if (handleShieldInput(e)) return;
    if (handleMeleeInput(e)) return;
    if (handleRangedInput(e)) return;
  });

  // ── Global delegated change ───────────────────────────────────────────────
  document.addEventListener("change", (e) => {
    if (handleArmorChange(e)) return;
    if (handleShieldChange(e)) return;
    if (handleMeleeChange(e)) return;
    if (handleRangedChange(e)) return;
  });
}
