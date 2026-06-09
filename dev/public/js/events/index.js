import { on } from "../shared/dom.js";
import { runEngine } from "../engine/index.js";
import { addAdv, filterAdvByType } from "../traits/advantages.js";
import { addDis, filterDisByType } from "../traits/disadvantages.js";
import { addSkill, filterSkillsByCategory } from "../traits/skills.js";
import { addSpell, filterSpellsBySchool } from "../traits/spells.js";
import {
  updateArmorNameOptions,
  updateArmorTierOptions,
} from "../inventory/armor.js";
import { updateShieldTierOptions } from "../inventory/shield.js";
import { updateMeleeTierOptions } from "../inventory/melee.js";
import { updateRangedTierOptions } from "../inventory/ranged.js";
import { updateLooseAmmoOptions } from "../inventory/ammo.js";
import {
  handleCustomInventoryClick,
  handleCustomInventoryInput,
  handleCustomInventoryChange,
  handleAddCustomItem,
} from "./customInventoryEvents.js";
import { exportSheet, importSheet } from "../store/persistence.js";
import {
  filterSubRacesByName,
  selectSubRace,
} from "../character/races.js";
import {
  handleCharacterInput,
  handleCharacterChange,
} from "./characterEvents.js";

import { handleTraitClick, handleTraitInput } from "./traitEvents.js";
import {
  handleSkillClick,
  handleSkillChange,
  handleSkillInput,
} from "./skillEvents.js";
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
import {
  handleAmmoClick,
  handleAmmoInput,
  handleAmmoChange,
  handleAddContainer,
  handleAddLooseAmmo,
} from "./ammoEvents.js";
import {
  handleAlchemyClick,
  handleAlchemyInput,
  handleAlchemyChange,
  handleAddAlchemy,
} from "./alchemyEvents.js";
import {
  handleSurvivalGearClick,
  handleSurvivalGearInput,
  handleSurvivalGearChange,
  handleAddSurvivalGear,
} from "./survivalGearEvents.js";
import {
  updateAlchemyTypeOptions,
  updateAlchemyTierOptions,
} from "../inventory/alchemy.js";
// ─────────────────────────────────────────────────────────────────────────────
// BIND ALL UI LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

export function bindUI() {
  // ── Character Info & Race ────────────────────────────────────────────────
  on("raceNameSelect", "change", filterSubRacesByName);
  on("raceSubSelect", "change", selectSubRace);

  // ── Traits ────────────────────────────────────────────────────────────────
  on("advTypeSelect", "change", filterAdvByType);
  on("advSelect", "change", () => {}); // keeps select reactive
  on("addAdvBtn", "click", addAdv);

  on("disTypeSelect", "change", filterDisByType);
  on("disSelect", "change", () => {}); // keeps select reactive
  on("addDisBtn", "click", addDis);

  on("skillCategorySelect", "change", filterSkillsByCategory);
  on("addSkillBtn", "click", addSkill);

  on("spellSchoolSelect", "change", filterSpellsBySchool);
  on("addSpellBtn", "click", addSpell);

  // ── Armor ─────────────────────────────────────────────────────────────────
  on("armorSlotSelect", "change", updateArmorNameOptions);
  on("armorNameSelect", "change", updateArmorTierOptions);
  on("addArmorBtn", "click", handleAddArmor);

  // ── Shields ───────────────────────────────────────────────────────────────
  on("shieldNameSelect", "change", updateShieldTierOptions);
  on("addShieldBtn", "click", handleAddShield);

  // ── Melee ─────────────────────────────────────────────────────────────────
  on("meleeNameSelect", "change", updateMeleeTierOptions);
  on("addMeleeBtn", "click", handleAddMelee);

  // ── Ranged ─────────────────────────────────────────────────────────────────
  on("rangedNameSelect", "change", updateRangedTierOptions);
  on("addRangedBtn", "click", handleAddRanged);

  // ── Ammo ──────────────────────────────────────────────────────────────────
  on("looseAmmoTypeFilter", "change", updateLooseAmmoOptions);
  on("addAmmoContainerBtn", "click", handleAddContainer);
  on("addLooseAmmoBtn", "click", handleAddLooseAmmo);

  // ── Alchemy ───────────────────────────────────────────────────────────────
  on("alchemyTypeFilter", "change", updateAlchemyTypeOptions);
  on("alchemyNameSelect", "change", updateAlchemyTierOptions);
  on("addAlchemyBtn", "click", handleAddAlchemy);

  // ── Survival Gear ─────────────────────────────────────────────────────────
  on("survivalGearTypeFilter", "change", handleSurvivalGearChange);
  on("addSurvivalGearBtn", "click", handleAddSurvivalGear);

  // ── Custom Inventory ──────────────────────────────────────────────────────
  on("addCustomItemBtn", "click", handleAddCustomItem);

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
    if (handleSkillClick(e)) return;
    if (handleArmorClick(e)) return;
    if (handleShieldClick(e)) return;
    if (handleMeleeClick(e)) return;
    if (handleRangedClick(e)) return;
    if (handleAmmoClick(e)) return;
    if (handleAlchemyClick(e)) return;
    if (handleSurvivalGearClick(e)) return;
    if (handleCustomInventoryClick(e)) return;
  });

  // ── Global delegated input ────────────────────────────────────────────────
  document.addEventListener("input", (e) => {
    if (handleCharacterInput(e)) return;
    if (handleTraitInput(e)) return;
    if (handleSkillInput(e)) return;
    if (handleArmorInput(e)) return;
    if (handleShieldInput(e)) return;
    if (handleMeleeInput(e)) return;
    if (handleRangedInput(e)) return;
    if (handleAmmoInput(e)) return;
    if (handleAlchemyInput(e)) return;
    if (handleSurvivalGearInput(e)) return;
    if (handleCustomInventoryInput(e)) return;
  });

  // ── Global delegated change ───────────────────────────────────────────────
  document.addEventListener("change", (e) => {
    if (handleSkillChange(e)) return;
    if (handleCharacterChange(e)) return;
    if (handleArmorChange(e)) return;
    if (handleShieldChange(e)) return;
    if (handleMeleeChange(e)) return;
    if (handleRangedChange(e)) return;
    if (handleAmmoChange(e)) return;
    if (handleAlchemyChange(e)) return;
    if (handleSurvivalGearChange(e)) return;
    if (handleCustomInventoryChange(e)) return;
  });

  // ── Stepper buttons (mobile ± on num-stepper inputs) ──────────────────────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".stepper-btn");
    if (!btn) return;
    const input = btn.closest(".num-stepper")?.querySelector("input");
    if (!input) return;
    const step = parseFloat(input.dataset.step ?? input.step) || 1;
    const current = parseFloat(input.value) || 0;
    const next = btn.classList.contains("stepper-inc")
      ? current + step
      : current - step;
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
