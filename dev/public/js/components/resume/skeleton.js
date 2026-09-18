// The resume panel's static markup, extracted from index.html so the sheet page, the
// allies page, and tests/dev/helpers/resumeDomFixture.js all mount one source instead of
// keeping hand-synced copies. Containers are empty on purpose — every renderer in this
// folder writes into them by id.

const HOST_ID = "resume-panel-host";
const PANEL_ID = "tab-char-resume";

export const RESUME_PANEL_HTML = `
  <div id="${PANEL_ID}">
    <!-- Row 1: portrait (hidden until an image exists) + name -->
    <div class="resume-row resume-row--name">
      <div id="resume-charimg-wrapper" class="resume-charimg-wrapper" hidden>
        <div class="resume-charimg-frame" id="resume-charimg-bg">
          <img id="resume-charimg-img" class="resume-charimg-img" src="" alt="" />
        </div>
      </div>
      <p class="resume-char-name" id="resume_header_name"></p>
    </div>

    <!-- Row 2: primary attribute boxes -->
    <div class="resume-row resume-row--primary-attrs" id="resume_primary_attrs"></div>

    <!-- Row 3: bars + secondary snapshot -->
    <div class="resume-row resume-row--bars-secondary">
      <div class="resume-bars-block">
        <div id="resume_bar_hp"></div>
        <div id="resume_bar_mana"></div>
        <div id="resume_bar_toxicity"></div>
      </div>
      <div id="resume_secondary_snapshot"></div>
    </div>

    <!-- Row 3.5: elemental resistances — only shown when one differs from normal -->
    <div class="resume-row">
      <div class="resume-full-col" id="resume_elemental_resistances_container"></div>
    </div>

    <!-- Row 4: advantages | disadvantages -->
    <div class="resume-row resume-row--two-col">
      <div class="resume-col" id="resume_advantages_container"></div>
      <div class="resume-col" id="resume_disadvantages_container"></div>
    </div>

    <!-- Row 5: skills -->
    <div class="resume-row">
      <div class="resume-full-col" id="resume_skills_container"></div>
    </div>

    <!-- Row 6: magic -->
    <div class="resume-row">
      <div class="resume-full-col" id="resume_magic_container"></div>
    </div>

    <!-- Row 7: armor | shield -->
    <div class="resume-row resume-row--two-col">
      <div class="resume-col" id="resume_armor_container"></div>
      <div class="resume-col" id="resume_shield_container"></div>
    </div>

    <!-- Row 8: melee | ranged -->
    <div class="resume-row resume-row--two-col">
      <div class="resume-col" id="resume_melee_container"></div>
      <div class="resume-col" id="resume_ranged_container"></div>
    </div>

    <!-- Row 9: firearms -->
    <div class="resume-row">
      <div class="resume-full-col" id="resume_firearms_container"></div>
    </div>

    <!-- Row 10: ammo | alchemy -->
    <div class="resume-row resume-row--two-col">
      <div class="resume-col" id="resume_ammo_container"></div>
      <div class="resume-col" id="resume_alchemy_container"></div>
    </div>

    <!-- Row 11: weight | value -->
    <div class="resume-row resume-row--two-col">
      <div class="resume-col">
        <h3 class="resume-col-title" id="sec-resume-weight"></h3>
        <table class="resume-table">
          <tbody>
            <tr class="resume-expander-row" data-tbody-target="resume_weight_tbody">
              <td colspan="2">
                <button class="resume-expander-btn" aria-expanded="false" aria-label="Expandir">
                  <span class="resume-expander-arrow">&#8250;</span>
                  <span id="sec-resume-weight-detail"></span>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody id="resume_weight_tbody" class="resume-collapsible" hidden></tbody>
          <tbody>
            <tr class="resume-total-row">
              <td><strong id="lbl-resume-totalWeight"></strong></td>
              <td class="col-num" id="resume_total_weight_cell"><strong>0</strong></td>
            </tr>
          </tbody>
        </table>
        <p class="resume-encumbrance">
          <strong id="lbl-encumbrance"></strong>
          <span id="encumbrance">—</span>
        </p>
        <div id="carry_limits"></div>

        <!-- Legacy hidden spans kept for updateInventoryUI compatibility -->
        <span id="armor_weight" style="display: none">0</span>
        <span id="shield_weight" style="display: none">0</span>
        <span id="melee_weight" style="display: none">0</span>
        <span id="ranged_weight" style="display: none">0</span>
        <span id="firearms_weight" style="display: none">0</span>
        <span id="ammo_weight" style="display: none">0</span>
        <span id="alchemy_weight" style="display: none">0</span>
        <span id="survival_gear_weight" style="display: none">0</span>
        <span id="magic_gear_weight" style="display: none">0</span>
        <span id="custom_inventory_weight" style="display: none">0</span>
        <span id="total_weight" style="display: none">0</span>
      </div>

      <div class="resume-col">
        <h3 class="resume-col-title" id="sec-resume-value"></h3>
        <table class="resume-table">
          <tbody>
            <tr class="resume-expander-row" data-tbody-target="resume_value_tbody">
              <td colspan="2">
                <button class="resume-expander-btn" aria-expanded="false" aria-label="Expandir">
                  <span class="resume-expander-arrow">&#8250;</span>
                  <span id="sec-resume-value-detail"></span>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody id="resume_value_tbody" class="resume-collapsible" hidden></tbody>
          <tbody>
            <tr class="resume-total-row">
              <td><strong id="lbl-resume-totalValue"></strong></td>
              <td class="col-num" id="resume_total_value_cell"><strong>0</strong></td>
            </tr>
            <tr class="resume-coins-row" id="resume_coins_row" hidden>
              <td colspan="2" class="resume-coins-cell">
                <span class="resume-coins-value">0</span>
                <span id="lbl-resume-coins-carried"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

// Must run before anything that reads the panel — initViewMode() moves #tab-char-resume,
// and updateActualValues() reads the legacy weight spans above.
export function mountResumePanel(hostId = HOST_ID) {
  const host = document.getElementById(hostId);
  if (!host || document.getElementById(PANEL_ID)) return;

  host.innerHTML = RESUME_PANEL_HTML;
}
