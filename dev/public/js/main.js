import { bindUI } from "./events/index.js";
import { initNav } from "./components/nav.js";
import { initTabs } from "./components/tabs.js";
import { initViewMode } from "./components/viewMode.js";
import { initTheme } from "./components/theme.js";
import { setupAutoRun } from "./compute/attributes.js";
import { updateActualValues, initAttributeTableHeaders } from "./ui.js";
import { runEngine } from "./compute/index.js";
import { initAutoRun } from "./compute/autorun.js";
import { loadRaces } from "./engine/character/races/index.js";
import { initCharacterImage } from "./engine/character/portrait/index.js";
import { loadAdvantages } from "./engine/character/traits/advantages/index.js";
import { loadDisadvantages } from "./engine/character/traits/disadvantages/index.js";
import { loadSkills } from "./engine/character/skills/index.js";
import { loadSpells } from "./engine/magic/spells/index.js";
import { loadArmors } from "./engine/inventory/armor/index.js";
import { loadShields } from "./engine/inventory/shield/index.js";
import { loadMeleeWeapons } from "./engine/inventory/melee/index.js";
import { loadRangedWeapons } from "./engine/inventory/ranged/index.js";
import { loadFirearms } from "./engine/inventory/firearms/index.js";
import { loadAmmo } from "./engine/inventory/ammo/index.js";
import { loadAlchemy } from "./engine/inventory/alchemy/index.js";
import { loadSurvivalGear } from "./engine/inventory/survivalGear/index.js";
import { loadAccessories } from "./engine/inventory/accessories/index.js";
import { loadMagicGear } from "./engine/inventory/magicGear/index.js";
import { loadEnchantments } from "./engine/inventory/shared/enchantments/index.js";
import { initCharacters } from "./store/characters.js";
import { initCharacterSelector } from "./components/characterSelector.js";

// ===== INIT =====
window.onload = async () => {
  initAutoRun(runEngine);
  bindUI();
  initNav();
  initTabs();
  initViewMode();
  initTheme();
  setupAutoRun();
  initAttributeTableHeaders();
  updateActualValues();

  await Promise.all([
    loadRaces(),
    loadAdvantages(),
    loadDisadvantages(),
    loadSkills(),
    loadSpells(),
    loadArmors(),
    loadShields(),
    loadMeleeWeapons(),
    loadRangedWeapons(),
    loadFirearms(),
    loadAmmo(),
    loadAlchemy(),
    loadSurvivalGear(),
    loadAccessories(),
    loadMagicGear(),
    loadEnchantments(),
  ]);

  // Init character persistence (loads active character into state)
  initCharacters();

  // Wire character selector UI
  initCharacterSelector();

  // Init character portrait
  initCharacterImage();
};
