import { state } from "../state.js";
import { setCatalogAudience } from "../shared/availability.js";
import { loadRaces } from "../engine/character/races/index.js";
import { loadAdvantages } from "../engine/character/traits/advantages/index.js";
import { loadDisadvantages } from "../engine/character/traits/disadvantages/index.js";
import { loadSkills } from "../engine/character/skills/index.js";
import { loadSpells } from "../engine/magic/spells/index.js";
import { loadArmors } from "../engine/inventory/armor/index.js";
import { loadShields } from "../engine/inventory/shield/index.js";
import { loadMeleeWeapons } from "../engine/inventory/melee/index.js";
import { loadRangedWeapons } from "../engine/inventory/ranged/index.js";
import { loadFirearms } from "../engine/inventory/firearms/index.js";
import { loadAmmo } from "../engine/inventory/ammo/index.js";
import { loadAlchemy } from "../engine/inventory/alchemy/index.js";
import { loadSurvivalGear } from "../engine/inventory/survivalGear/index.js";
import { loadAccessories } from "../engine/inventory/accessories/index.js";
import { loadMagicGear } from "../engine/inventory/magicGear/index.js";
import { loadEnchantments } from "../engine/inventory/shared/enchantments/index.js";
import { loadDualUseWeapons } from "../engine/inventory/shared/dualUseWeapons.js";
import { loadMaterials } from "../engine/inventory/shared/materials.js";

// Every load*() below refetches unconditionally except loadRaces, which caches on
// data.races.length — clearing it here is what forces a re-fetch under the new audience.
// Nothing is hardcoded to "the domains that currently use available_for": any load*() added
// here automatically gets re-filtered on every kind switch, so a future CSV opting into
// available_for never needs this list touched.
export async function reloadCatalogs(audience) {
  setCatalogAudience(audience);
  state.data.races = [];

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
}
