// resume.js's renderers are module-private, so this must expose every container id renderResume() might touch; table containers are wrapped in <table> since jsdom drops bare <tbody>/<td>/<th>.
import { resetDOM } from "./domFixture.js";

export const RESUME_SKELETON = `
  <span id="resume_header_name"></span>
  <div id="resume-charimg-wrapper" hidden></div>

  <div id="resume_primary_attrs"></div>
  <div id="resume_bar_hp"></div>
  <div id="resume_bar_mana"></div>
  <div id="resume_bar_toxicity"></div>
  <div id="resume_secondary_snapshot"></div>
  <div id="resume_elemental_resistances_container"></div>

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

export function resetResumeDOM() {
  resetDOM(RESUME_SKELETON);
}
