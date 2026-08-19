import { on } from "../shared/dom.js";
import { runEngine } from "../compute/index.js";

import {
  filterSubRacesByName,
  selectSubRace,
  handleCharacterInput,
  handleCharacterChange,
  handleCharacterImageClick,
  handleCharacterImageChange,
  handleCharacterImageInput,
} from "../engine/character/index.js";

import {
  addAdv,
  filterAdvByType,
  addDis,
  filterDisByType,
  addSkill,
  filterSkillsByCategory,
  handleTraitClick,
  handleTraitInput,
  handleSkillClick,
  handleSkillChange,
  handleSkillInput,
} from "../engine/character/index.js";

import {
  addSpell,
  filterSpellsBySchool,
  handleSpellClick,
  handleSpellInput,
} from "../engine/magic/index.js";

import {
  updateArmorNameOptions,
  updateArmorTierOptions,
  handleArmorClick,
  handleArmorInput,
  handleArmorChange,
  handleAddArmor,
} from "../engine/inventory/armor/index.js";
import {
  updateShieldTierOptions,
  handleShieldClick,
  handleShieldInput,
  handleShieldChange,
  handleAddShield,
} from "../engine/inventory/shield/index.js";
import {
  updateMeleeTierOptions,
  updateMeleeTypeOptions,
  handleMeleeClick,
  handleMeleeInput,
  handleMeleeChange,
  handleAddMelee,
} from "../engine/inventory/melee/index.js";
import {
  updateRangedTierOptions,
  updateRangedTypeOptions,
  handleRangedClick,
  handleRangedInput,
  handleRangedChange,
  handleAddRanged,
} from "../engine/inventory/ranged/index.js";
import {
  updateFirearmTierOptions,
  updateFirearmTypeOptions,
  handleFirearmClick,
  handleFirearmInput,
  handleFirearmChange,
  handleAddFirearm,
} from "../engine/inventory/firearms/index.js";
import {
  updateLooseAmmoOptions,
  handleAmmoClick,
  handleAmmoInput,
  handleAmmoChange,
  handleAddContainer,
  handleAddLooseAmmo,
} from "../engine/inventory/ammo/index.js";
import {
  updateAlchemyTypeOptions,
  updateAlchemyTierOptions,
  handleAlchemyClick,
  handleAlchemyInput,
  handleAlchemyChange,
  handleAddAlchemy,
} from "../engine/inventory/alchemy/index.js";
import {
  handleSurvivalGearClick,
  handleSurvivalGearInput,
  handleSurvivalGearChange,
  handleAddSurvivalGear,
} from "../engine/inventory/survivalGear/index.js";
import {
  handleAccessoryClick,
  handleAccessoryInput,
  handleAccessoryChange,
  handleAddAccessory,
} from "../engine/inventory/accessories/index.js";
import {
  handleMagicGearClick,
  handleMagicGearInput,
  handleMagicGearChange,
  handleAddMagicGear,
} from "../engine/inventory/magicGear/index.js";
import {
  handleCustomInventoryClick,
  handleCustomInventoryInput,
  handleCustomInventoryChange,
  handleAddCustomItem,
} from "../engine/inventory/customInventory/index.js";
import {
  handleCoinPurseClick,
  handleCoinPurseInput,
  handleCoinPurseChange,
  handleAddCoins,
} from "../engine/inventory/coinPurse/index.js";

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
  on("meleeTypeFilter", "change", updateMeleeTypeOptions);
  on("meleeNameSelect", "change", updateMeleeTierOptions);
  on("addMeleeBtn", "click", handleAddMelee);

  // ── Ranged ─────────────────────────────────────────────────────────────────
  on("rangedTypeFilter", "change", updateRangedTypeOptions);
  on("rangedNameSelect", "change", updateRangedTierOptions);
  on("addRangedBtn", "click", handleAddRanged);

  // ── Firearms ──────────────────────────────────────────────────────────────
  on("firearmTypeFilter", "change", updateFirearmTypeOptions);
  on("firearmNameSelect", "change", updateFirearmTierOptions);
  on("addFirearmBtn", "click", handleAddFirearm);

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

  // ── Accessories ───────────────────────────────────────────────────────────
  on("addAccessoryBtn", "click", handleAddAccessory);

  // ── Magic Gear ────────────────────────────────────────────────────────────
  on("addMagicGearBtn", "click", handleAddMagicGear);

  // ── Custom Inventory ──────────────────────────────────────────────────────
  on("addCustomItemBtn", "click", handleAddCustomItem);

  // ── Coin Purse ────────────────────────────────────────────────────────────
  on("addCoinBtn", "click", handleAddCoins);

  // ── Engine ────────────────────────────────────────────────────────────────
  on("runEngineBtn", "click", runEngine);

  // ── Global delegated click ────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    if (handleTraitClick(e)) return;
    if (handleSkillClick(e)) return;
    if (handleSpellClick(e)) return;
    if (handleArmorClick(e)) return;
    if (handleShieldClick(e)) return;
    if (handleMeleeClick(e)) return;
    if (handleRangedClick(e)) return;
    if (handleFirearmClick(e)) return;
    if (handleAmmoClick(e)) return;
    if (handleAlchemyClick(e)) return;
    if (handleSurvivalGearClick(e)) return;
    if (handleAccessoryClick(e)) return;
    if (handleMagicGearClick(e)) return;
    if (handleCustomInventoryClick(e)) return;
    if (handleCoinPurseClick(e)) return;
    if (handleCharacterImageClick(e)) return;
  });

  // ── Global delegated input ────────────────────────────────────────────────
  document.addEventListener("input", (e) => {
    if (handleCharacterInput(e)) return;
    if (handleTraitInput(e)) return;
    if (handleSkillInput(e)) return;
    if (handleSpellInput(e)) return;
    if (handleArmorInput(e)) return;
    if (handleShieldInput(e)) return;
    if (handleMeleeInput(e)) return;
    if (handleRangedInput(e)) return;
    if (handleFirearmInput(e)) return;
    if (handleAmmoInput(e)) return;
    if (handleAlchemyInput(e)) return;
    if (handleSurvivalGearInput(e)) return;
    if (handleAccessoryInput(e)) return;
    if (handleMagicGearInput(e)) return;
    if (handleCustomInventoryInput(e)) return;
    if (handleCoinPurseInput(e)) return;
    if (handleCharacterImageInput(e)) return;
  });

  // ── Global delegated change ───────────────────────────────────────────────
  document.addEventListener("change", (e) => {
    if (handleSkillChange(e)) return;
    if (handleCharacterChange(e)) return;
    if (handleArmorChange(e)) return;
    if (handleShieldChange(e)) return;
    if (handleMeleeChange(e)) return;
    if (handleRangedChange(e)) return;
    if (handleFirearmChange(e)) return;
    if (handleAmmoChange(e)) return;
    if (handleAlchemyChange(e)) return;
    if (handleSurvivalGearChange(e)) return;
    if (handleAccessoryChange(e)) return;
    if (handleMagicGearChange(e)) return;
    if (handleCustomInventoryChange(e)) return;
    if (handleCoinPurseChange(e)) return;
    if (handleCharacterImageChange(e)) return;
  });

  // ── Stepper buttons (mobile ± on num-stepper inputs) ──────────────────────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".stepper-btn");
    if (!btn) return;
    const input = btn.closest(".num-stepper")?.querySelector("input");
    if (!input) return;
    const step = parseFloat(input.dataset.step ?? input.step) || 1;
    const current = parseFloat(input.value) || 0;
    let next = btn.classList.contains("stepper-inc")
      ? current + step
      : current - step;
    if (input.dataset.min !== undefined)
      next = Math.max(next, Number(input.dataset.min));
    if (input.dataset.max !== undefined)
      next = Math.min(next, Number(input.dataset.max));
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
