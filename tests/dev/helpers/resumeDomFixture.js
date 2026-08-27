/**
 * resumeDomFixture.js
 *
 * Shared container skeleton for the resume.js test suite (Batch 7f).
 *
 * resume.js exports only renderResume(sheet, data, selected) and
 * initResumeExpanders() — every section renderer (_renderResumeArmor,
 * _renderBar, etc.) is module-private, so every sub-batch of 7f can only
 * reach its target section by calling the real renderResume() against a
 * DOM that has every container id resume.js might touch. This fixture is
 * that DOM, built once and reused unmodified across 7f-i..7f-v so each
 * sub-batch only needs to feed a `sheet` payload targeted at its own
 * section — every other section safely no-ops against an empty/undefined
 * slice of the sheet.
 *
 * Table-shaped containers (tbody targets, the carry-limits table) are
 * wrapped in a real <table> — jsdom's spec-compliant HTML parser silently
 * drops bare <tbody>/<td>/<th> inserted outside a <table> context.
 */
import { resetDOM } from "./domFixture.js";

export const RESUME_SKELETON = `
  <span id="resume_header_name"></span>
  <div id="resume-charimg-wrapper" hidden></div>

  <div id="resume_primary_attrs"></div>
  <div id="resume_bar_hp"></div>
  <div id="resume_bar_mana"></div>
  <div id="resume_bar_toxicity"></div>
  <div id="resume_secondary_snapshot"></div>

  <div id="resume_advantages_container"></div>
  <div id="resume_disadvantages_container"></div>
  <div id="resume_skills_container"></div>
  <div id="resume_magic_container"></div>

  <div id="resume_armor_container"></div>
  <div id="resume_shield_container"></div>
  <div id="resume_melee_container"></div>
  <div id="resume_ranged_container"></div>
  <div id="resume_firearms_container"></div>
  <div id="resume_ammo_container"></div>
  <div id="resume_alchemy_container"></div>

  <input id="weight" value="0" />
  <table>
    <tbody id="resume_weight_tbody"></tbody>
    <tfoot><tr><td id="resume_total_weight_cell"></td></tr></tfoot>
  </table>
  <span id="armor_weight"></span>
  <span id="shield_weight"></span>
  <span id="melee_weight"></span>
  <span id="ranged_weight"></span>
  <span id="firearms_weight"></span>
  <span id="ammo_weight"></span>
  <span id="alchemy_weight"></span>
  <span id="survival_gear_weight"></span>
  <span id="magic_gear_weight"></span>
  <span id="custom_inventory_weight"></span>
  <span id="total_weight"></span>
  <span id="encumbrance"></span>
  <div id="carry_limits"></div>

  <table>
    <tbody id="resume_value_tbody"></tbody>
    <tfoot><tr><td id="resume_total_value_cell"></td></tr></tfoot>
  </table>
  <div id="resume_coins_row"></div>
  <span class="resume-coins-value"></span>

  <table>
    <tbody id="resume_points_tbody"></tbody>
    <tfoot><tr><td id="resume_total_points_cell"></td></tr></tfoot>
  </table>
`;

/** resetDOM() with the full resume.js container skeleton applied. */
export function resetResumeDOM() {
  resetDOM(RESUME_SKELETON);
}
