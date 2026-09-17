import { bindUI } from "./events/index.js";
import { initNav } from "./components/nav.js";
import { initSelectLabels } from "./components/selectLabels.js";
import { initTabs } from "./components/tabs.js";
import { initViewMode } from "./components/viewMode.js";
import { initTheme } from "./components/theme.js";
import { setupAutoRun } from "./compute/attributes.js";
import {
  updateActualValues,
  initAttributeTableHeaders,
  renderListsPreserving,
} from "./ui.js";
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
import { loadDualUseWeapons } from "./engine/inventory/shared/dualUseWeapons.js";
import { loadMaterials } from "./engine/inventory/shared/materials.js";
import { initCharacters } from "./store/characters.js";
import { initCharacterSelector } from "./components/characterSelector.js";
import { state } from "./state.js";

export async function bootstrap() {
  initAutoRun(runEngine);
  bindUI();
  initNav();
  initTabs();
  initViewMode();
  initTheme();
  setupAutoRun();
  initAttributeTableHeaders();
  initSelectLabels();
  updateActualValues();

  // The load*() functions only fetch catalogs and populate their own add-form
  // selectors — none of them render. Rendering once here instead costs one DOM
  // sweep rather than one per catalog.
  await Promise.all([
    loadRaces(),
    loadAdvantages(),
    loadDisadvantages(),
    loadSkills(),
    loadSpells(),
    loadMaterials(),
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
    loadDualUseWeapons(),
  ]);

  // initCharacters() applies the active character, which ends in its own
  // renderListsPreserving + triggerAutoRun. Only render here when it couldn't
  // (no persisted character matched), so the empty sheet still paints.
  if (!initCharacters()) {
    renderListsPreserving(state.selected, state.data);
  }

  initCharacterSelector();
  initCharacterImage();
}

// Not `window.onload` — that waits on every image, delaying the catalog fetches.
// main.js is a module script, so it always runs before DOMContentLoaded fires.
document.addEventListener("DOMContentLoaded", bootstrap);
