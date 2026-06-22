import { bindUI } from "./events/index.js";
import { initNav } from "./ui/nav.js";
import { initTabs } from "./ui/tabs.js";
import { initViewMode } from "./ui/viewMode.js";
import { setupAutoRun } from "./engine/attributes.js";
import { updateActualValues } from "./ui.js";
import { runEngine } from "./engine/index.js";
import { initAutoRun } from "./engine/autorun.js";
import { loadRaces } from "./character/races.js";
import { loadAdvantages } from "./traits/advantages.js";
import { loadDisadvantages } from "./traits/disadvantages.js";
import { loadSkills } from "./traits/skills.js";
import { loadSpells } from "./traits/spells.js";
import { loadArmors } from "./inventory/armor.js";
import { loadShields } from "./inventory/shield.js";
import { loadMeleeWeapons } from "./inventory/melee.js";
import { loadRangedWeapons } from "./inventory/ranged.js";
import { loadAmmo } from "./inventory/ammo.js";
import { loadAlchemy } from "./inventory/alchemy.js";
import { loadSurvivalGear } from "./inventory/survivalGear.js";
import { initCharacters } from "./store/characters.js";
import { initCharacterSelector } from "./ui/characterSelector.js";

// ===== INIT =====
window.onload = async () => {
  initAutoRun(runEngine);
  bindUI();
  initNav();
  initTabs();
  initViewMode();
  setupAutoRun();
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
    loadAmmo(),
    loadAlchemy(),
    loadSurvivalGear(),
  ]);

  // Init character persistence (loads active character into state)
  initCharacters();

  // Wire character selector UI
  initCharacterSelector();
};
