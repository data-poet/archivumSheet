import { on } from "../shared/dom.js";
import { runEngine } from "../compute/index.js";
import { handleItemTabClick } from "../shared/itemTabs.js";

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
  updateContainerTypeOptions,
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
  updateMagicGearTypeOptions,
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
} from "../engine/inventory/coinPurse/index.js";

const DELEGATED_EVENT_TYPES = ["click", "input", "change"];

// One entry per delegated domain; all three listeners walk this same list, so
// adding a domain is one edit rather than one per event type. A handler returns
// true once it has claimed the event.
//
// Dispatch order cannot change the outcome: every domain matches on its own
// disjoint set of class names, and the handful that ARE shared across domains
// (custom-fields-*, enchantment-*) ownership-check the instance id and return
// false when it isn't theirs — see customFieldsDispatch.js.
const DELEGATED_DOMAINS = [
  { input: handleCharacterInput, change: handleCharacterChange },
  { click: handleTraitClick, input: handleTraitInput },
  {
    click: handleSkillClick,
    input: handleSkillInput,
    change: handleSkillChange,
  },
  { click: handleSpellClick, input: handleSpellInput },
  {
    click: handleArmorClick,
    input: handleArmorInput,
    change: handleArmorChange,
  },
  {
    click: handleShieldClick,
    input: handleShieldInput,
    change: handleShieldChange,
  },
  {
    click: handleMeleeClick,
    input: handleMeleeInput,
    change: handleMeleeChange,
  },
  {
    click: handleRangedClick,
    input: handleRangedInput,
    change: handleRangedChange,
  },
  {
    click: handleFirearmClick,
    input: handleFirearmInput,
    change: handleFirearmChange,
  },
  { click: handleAmmoClick, input: handleAmmoInput, change: handleAmmoChange },
  {
    click: handleAlchemyClick,
    input: handleAlchemyInput,
    change: handleAlchemyChange,
  },
  {
    click: handleSurvivalGearClick,
    input: handleSurvivalGearInput,
    change: handleSurvivalGearChange,
  },
  {
    click: handleAccessoryClick,
    input: handleAccessoryInput,
    change: handleAccessoryChange,
  },
  {
    click: handleMagicGearClick,
    input: handleMagicGearInput,
    change: handleMagicGearChange,
  },
  {
    click: handleCustomInventoryClick,
    input: handleCustomInventoryInput,
    change: handleCustomInventoryChange,
  },
  {
    click: handleCoinPurseClick,
    input: handleCoinPurseInput,
    change: handleCoinPurseChange,
  },
  {
    click: handleCharacterImageClick,
    input: handleCharacterImageInput,
    change: handleCharacterImageChange,
  },
];

export function bindUI() {
  on("raceNameSelect", "change", filterSubRacesByName);
  on("raceSubSelect", "change", selectSubRace);

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

  on("armorSlotSelect", "change", updateArmorNameOptions);
  on("armorNameSelect", "change", updateArmorTierOptions);
  on("addArmorBtn", "click", handleAddArmor);

  on("shieldNameSelect", "change", updateShieldTierOptions);
  on("addShieldBtn", "click", handleAddShield);

  on("meleeTypeFilter", "change", updateMeleeTypeOptions);
  on("meleeNameSelect", "change", updateMeleeTierOptions);
  on("addMeleeBtn", "click", handleAddMelee);

  on("rangedTypeFilter", "change", updateRangedTypeOptions);
  on("rangedNameSelect", "change", updateRangedTierOptions);
  on("addRangedBtn", "click", handleAddRanged);

  on("firearmTypeFilter", "change", updateFirearmTypeOptions);
  on("firearmNameSelect", "change", updateFirearmTierOptions);
  on("addFirearmBtn", "click", handleAddFirearm);

  on("ammoContainerTypeFilter", "change", updateContainerTypeOptions);
  on("looseAmmoTypeFilter", "change", updateLooseAmmoOptions);
  on("addAmmoContainerBtn", "click", handleAddContainer);
  on("addLooseAmmoBtn", "click", handleAddLooseAmmo);

  on("alchemyTypeFilter", "change", updateAlchemyTypeOptions);
  on("alchemyNameSelect", "change", updateAlchemyTierOptions);
  on("addAlchemyBtn", "click", handleAddAlchemy);

  on("survivalGearTypeFilter", "change", handleSurvivalGearChange);
  on("addSurvivalGearBtn", "click", handleAddSurvivalGear);

  on("addAccessoryBtn", "click", handleAddAccessory);

  on("magicGearTypeFilter", "change", updateMagicGearTypeOptions);
  on("addMagicGearBtn", "click", handleAddMagicGear);

  on("addCustomItemBtn", "click", handleAddCustomItem);

  on("runEngineBtn", "click", runEngine);

  DELEGATED_EVENT_TYPES.forEach((type) => {
    document.addEventListener(type, (e) => {
      for (const domain of DELEGATED_DOMAINS) {
        if (domain[type]?.(e)) return;
      }
    });
  });

  // Registered separately from the domain chain above, not folded into it: item
  // tabs are cross-cutting UI rather than a domain, and as its own listener it
  // still runs even if a domain handler claimed the same click.
  document.addEventListener("click", (e) => {
    if (handleItemTabClick(e)) return;
  });

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
