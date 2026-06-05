import { on } from "../shared/dom.js";
import { runEngine } from "../engine/index.js";
import {
  loadAdvantages,
  addAdv,
  filterAdvByType,
} from "../traits/advantages.js";
import {
  loadDisadvantages,
  addDis,
  filterDisByType,
} from "../traits/disadvantages.js";
import {
  loadSkills,
  addSkill,
  filterSkillsByCategory,
} from "../traits/skills.js";
import {
  loadSpells,
  addSpell,
  filterSpellsBySchool,
} from "../traits/spells.js";
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
import { loadAmmo, updateLooseAmmoOptions } from "../inventory/ammo.js";
import { loadAlchemy } from "../inventory/alchemy.js";
import { exportSheet, importSheet } from "../store/persistence.js";
import {
  loadRaces,
  filterSubRacesByName,
  selectSubRace,
} from "../character/races.js";
import {
  handleCharacterInput,
  handleCharacterChange,
} from "./characterEvents.js";

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
  updateAlchemyTypeOptions,
  updateAlchemyTierOptions,
} from "../inventory/alchemy.js";

// ─────────────────────────────────────────────────────────────────────────────
// BIND ALL UI LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

export function bindUI() {
  // ── Character Info & Race ────────────────────────────────────────────────
  on("loadRacesBtn", "click", loadRaces);
  on("raceNameSelect", "change", filterSubRacesByName);
  on("raceSubSelect", "change", selectSubRace);

  // ── Traits ────────────────────────────────────────────────────────────────
  on("loadAdvantagesBtn", "click", loadAdvantages);
  on("advTypeSelect", "change", filterAdvByType);
  on("advSelect", "change", () => {}); // keeps select reactive
  on("addAdvBtn", "click", addAdv);

  on("loadDisadvantagesBtn", "click", loadDisadvantages);
  on("disTypeSelect", "change", filterDisByType);
  on("disSelect", "change", () => {}); // keeps select reactive
  on("addDisBtn", "click", addDis);

  on("loadSkillsBtn", "click", loadSkills);
  on("skillCategorySelect", "change", filterSkillsByCategory);
  on("addSkillBtn", "click", addSkill);

  on("loadSpellsBtn", "click", loadSpells);
  on("spellSchoolSelect", "change", filterSpellsBySchool);
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

  // ── Ammo ──────────────────────────────────────────────────────────────────
  on("loadAmmoBtn", "click", loadAmmo);
  on("looseAmmoTypeFilter", "change", updateLooseAmmoOptions);
  on("addAmmoContainerBtn", "click", handleAddContainer);
  on("addLooseAmmoBtn", "click", handleAddLooseAmmo);

  // ── Alchemy ───────────────────────────────────────────────────────────────
  on("loadAlchemyBtn", "click", loadAlchemy);
  on("alchemyTypeFilter", "change", updateAlchemyTypeOptions);
  on("alchemyNameSelect", "change", updateAlchemyTierOptions);
  on("addAlchemyBtn", "click", handleAddAlchemy);

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
    if (handleAmmoClick(e)) return;
    if (handleAlchemyClick(e)) return;
  });

  // ── Global delegated input ────────────────────────────────────────────────
  document.addEventListener("input", (e) => {
    if (handleCharacterInput(e)) return;
    if (handleTraitInput(e)) return;
    if (handleArmorInput(e)) return;
    if (handleShieldInput(e)) return;
    if (handleMeleeInput(e)) return;
    if (handleRangedInput(e)) return;
    if (handleAmmoInput(e)) return;
    if (handleAlchemyInput(e)) return;
  });

  // ── Global delegated change ───────────────────────────────────────────────
  document.addEventListener("change", (e) => {
    if (handleCharacterChange(e)) return;
    if (handleArmorChange(e)) return;
    if (handleShieldChange(e)) return;
    if (handleMeleeChange(e)) return;
    if (handleRangedChange(e)) return;
    if (handleAmmoChange(e)) return;
    if (handleAlchemyChange(e)) return;
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
