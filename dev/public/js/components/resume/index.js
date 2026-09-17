// Read-only summary of the whole sheet, split by domain. Each section module owns
// its own containers and writes into them rather than innerHTML-ing the root panel,
// which is what lets collapsed/expanded state survive a re-render.
//
// Section order below is the visual order on the page.

import { renderResumeImage } from "../../engine/character/portrait/portrait.js";
import { initResumeExpanders } from "./shared.js";
import {
  renderResumeHeader,
  renderExperienceBar,
  renderResumePrimaryAttributes,
  renderResumeBars,
  renderResumeSecondarySnapshot,
} from "./vitals.js";
import { renderResumeElementalResistances } from "./elementalResistances.js";
import {
  renderResumeTraits,
  renderResumeSkills,
  renderResumeMagic,
} from "./traitsSkillsMagic.js";
import {
  renderResumeArmor,
  renderResumeShield,
  renderResumeMelee,
  renderResumeRanged,
} from "./wornEquipment.js";
import {
  renderResumeFirearms,
  renderResumeAmmo,
  renderResumeAlchemy,
} from "./rangedSupplies.js";
import {
  renderResumeWeight,
  renderResumeValue,
  renderResumePoints,
} from "./totals.js";

export { initResumeExpanders };

export function renderResume(sheet, data = {}, selected = {}) {
  initResumeExpanders();

  renderResumeHeader(sheet);
  renderExperienceBar(sheet);
  renderResumeImage();
  renderResumePrimaryAttributes(sheet);
  renderResumeBars(sheet);
  renderResumeSecondarySnapshot(sheet);
  renderResumeElementalResistances(sheet);
  renderResumeTraits(sheet);
  renderResumeSkills(sheet);
  renderResumeMagic(sheet, data);
  renderResumeArmor(sheet);
  renderResumeShield(sheet);
  renderResumeMelee(sheet);
  renderResumeRanged(sheet);
  renderResumeFirearms(sheet);
  renderResumeAmmo(sheet, data, selected);
  renderResumeAlchemy(sheet);
  renderResumeWeight(sheet);
  renderResumeValue(sheet);
  renderResumePoints(sheet);
}
