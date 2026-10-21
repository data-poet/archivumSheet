// Compact summary of the whole sheet, split by domain. Not read-only: it doubles as the
// play surface, with steppers for attribute modifiers, current HP/Mana/Toxicity, ammo and
// item durability. Each section module owns its own containers and writes into them rather
// than innerHTML-ing the root panel, which is what lets collapsed/expanded state survive
// a re-render.

import { renderResumeImage } from "../../engine/character/portrait/resumeImage.js";
import { initResumeExpanders } from "./shared.js";
import { balanceResumeRows } from "./groupBalance.js";
import {
  renderResumeHeader,
  renderExperienceBar,
  renderResumePrimaryAttributes,
  renderResumeBars,
  renderResumeSecondarySnapshot,
} from "./vitals.js";
import { renderResumeConditions } from "./conditions.js";
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

// Array order is the visual order on the page.
const SECTIONS = [
  ({ sheet }) => renderResumeHeader(sheet),
  ({ sheet }) => renderExperienceBar(sheet),
  () => renderResumeImage(),
  ({ sheet }) => renderResumePrimaryAttributes(sheet),
  ({ sheet }) => renderResumeBars(sheet),
  ({ sheet }) => renderResumeSecondarySnapshot(sheet),
  ({ sheet, data, selected }) => renderResumeConditions(sheet, data, selected),
  ({ sheet }) => renderResumeElementalResistances(sheet),
  ({ sheet }) => renderResumeTraits(sheet),
  ({ sheet }) => renderResumeSkills(sheet),
  ({ sheet, data }) => renderResumeMagic(sheet, data),
  ({ sheet }) => renderResumeArmor(sheet),
  ({ sheet }) => renderResumeShield(sheet),
  ({ sheet }) => renderResumeMelee(sheet),
  ({ sheet }) => renderResumeRanged(sheet),
  ({ sheet }) => renderResumeFirearms(sheet),
  ({ sheet, data, selected }) => renderResumeAmmo(sheet, data, selected),
  ({ sheet }) => renderResumeAlchemy(sheet),
  ({ sheet }) => renderResumeWeight(sheet),
  ({ sheet }) => renderResumeValue(sheet),
  ({ sheet }) => renderResumePoints(sheet),
];

export function renderResume(sheet, data = {}, selected = {}) {
  initResumeExpanders();

  const ctx = { sheet, data, selected };

  for (const render of SECTIONS) {
    render(ctx);
  }

  balanceResumeRows();
}
