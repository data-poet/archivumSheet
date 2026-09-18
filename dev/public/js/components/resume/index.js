// Compact summary of the whole sheet, split by domain. Not read-only: it doubles as the
// play surface, with steppers for attribute modifiers, current HP/Mana/Toxicity, ammo and
// item durability. Each section module owns its own containers and writes into them rather
// than innerHTML-ing the root panel, which is what lets collapsed/expanded state survive
// a re-render.

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

export const RESUME_MODES = { PC: "pc", ALLY: "ally" };

// `pcOnly` marks sections an ally sheet has no business showing: it carries no point
// budget and no storage buckets, so the accounting totals and backpack consumables
// would render as empty or misleading. Array order is the visual order on the page.
const SECTIONS = [
  { render: ({ sheet }) => renderResumeHeader(sheet) },
  { pcOnly: true, render: ({ sheet }) => renderExperienceBar(sheet) },
  { render: (ctx) => _renderPortrait(ctx) },
  { render: ({ sheet }) => renderResumePrimaryAttributes(sheet) },
  { render: ({ sheet }) => renderResumeBars(sheet) },
  { render: ({ sheet }) => renderResumeSecondarySnapshot(sheet) },
  { render: ({ sheet }) => renderResumeElementalResistances(sheet) },
  { render: ({ sheet }) => renderResumeTraits(sheet) },
  { render: ({ sheet }) => renderResumeSkills(sheet) },
  { render: ({ sheet, data }) => renderResumeMagic(sheet, data) },
  { render: ({ sheet, opts }) => renderResumeArmor(sheet, opts) },
  { render: ({ sheet, opts }) => renderResumeShield(sheet, opts) },
  { render: ({ sheet, opts }) => renderResumeMelee(sheet, opts) },
  { render: ({ sheet, opts }) => renderResumeRanged(sheet, opts) },
  { render: ({ sheet, opts }) => renderResumeFirearms(sheet, opts) },
  {
    render: ({ sheet, data, selected, opts }) =>
      renderResumeAmmo(sheet, data, selected, opts),
  },
  { pcOnly: true, render: ({ sheet }) => renderResumeAlchemy(sheet) },
  { pcOnly: true, render: ({ sheet }) => renderResumeWeight(sheet) },
  { pcOnly: true, render: ({ sheet }) => renderResumeValue(sheet) },
  { pcOnly: true, render: ({ sheet }) => renderResumePoints(sheet) },
];

// The PC's portrait is still being edited elsewhere on the page, so it reads live state
// rather than the last built sheet; an ally's is fixed and comes from its catalog entry.
function _renderPortrait({ sheet, mode, portraitSrc }) {
  if (mode === RESUME_MODES.PC) return renderResumeImage();
  renderResumeImage(sheet?.pc?.image, portraitSrc);
}

export function renderResume(
  sheet,
  data = {},
  selected = {},
  { mode = RESUME_MODES.PC, portraitSrc = "" } = {},
) {
  initResumeExpanders();

  // Primary/secondary attributes stay editable in both modes (an ally tracks its own
  // damage and drain); `editable` governs equipment and supplies bookkeeping only.
  const ctx = {
    sheet,
    data,
    selected,
    mode,
    portraitSrc,
    opts: { editable: mode === RESUME_MODES.PC },
  };

  for (const section of SECTIONS) {
    if (section.pcOnly && mode !== RESUME_MODES.PC) continue;
    section.render(ctx);
  }
}
