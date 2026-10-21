// The resume panel's static markup, shared by PC rendering, ally rendering and
// tests/dev/helpers/resumeDomFixture.js. Containers are empty on purpose: every renderer in this folder writes
// into them by id.
//
// Structure: an always-visible header (identity + vitals, never hidden by a group switch), the
// resume's own group bar (#resume-groupnav, wired to RESUME_LAYOUT by main.js's createGroupNav()
// instance), then one `.l-section` per RESUME_LAYOUT section — grouped by when a player reaches
// for something in play, not by where it lives in the edit page.

import { t, LABELS } from "../../localization/pt-BR/index.js";
import { icon } from "../../shared/icons.js";
import { VITAL_ATTRIBUTES } from "../../shared/constants.js";
import { STORAGE_KEYS } from "../../shared/storageKeys.js";
import { createGroupNav } from "../groupNav.js";
import { RESUME_LAYOUT } from "../../layout/resumeLayout.js";

const HOST_ID = "resume-panel-host";
const PANEL_ID = "tab-char-resume";

export const RESUME_PANEL_HTML = `
  <div id="${PANEL_ID}">
    <div class="resume-header">
      <!-- Portrait (hidden until an image exists) + name -->
      <div class="resume-row resume-row--name">
        <div id="resume-charimg-wrapper" class="resume-charimg-wrapper" hidden>
          <div class="resume-charimg-frame" id="resume-charimg-bg">
            <img id="resume-charimg-img" class="resume-charimg-img" src="" alt="" />
          </div>
        </div>
        <p class="resume-char-name" id="resume_header_name"></p>
      </div>

      <!-- Vitals: always visible, whichever group is active -->
      <div class="resume-row">
        <div class="resume-bars-block">
          ${VITAL_ATTRIBUTES.map(({ bar }) => `<div id="resume_bar_${bar}"></div>`).join("")}
        </div>
      </div>
    </div>

    <!-- Not .l-groupnav: that class is the edit page's own fixed bar, hidden in view mode —
         exactly the state this one needs to be visible in. In-flow, scoped CSS only. -->
    <nav class="resume-groupnav" id="resume-groupnav"></nav>

    <div class="resume-groups">
      <!-- Status: left column is attrs (primary, then secondary below); right is
           conditions, then resistances below — two stacks, not row-paired parts. -->
      <section class="l-section resume-group-section" id="resume-section-attributes" data-group="status">
        <h3 class="resume-col-title" id="sec-resume-attributes-group"></h3>
        <div class="resume-row resume-row--primary-attrs" id="resume_primary_attrs"></div>
        <div class="resume-row">
          <div id="resume_secondary_snapshot"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-status" data-group="status">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_conditions_container" hidden></div>
        </div>
        <div class="resume-row">
          <div class="resume-full-col" id="resume_elemental_resistances_container"></div>
        </div>
      </section>

      <!-- Ataque: each weapon type and ammo is its own part, paired two-per-row by the
           desktop grid purely through DOM order — no nested two-col rows here. -->
      <section class="l-section resume-group-section" id="resume-section-melee" data-group="offense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_melee_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-ranged" data-group="offense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_ranged_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-firearms" data-group="offense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_firearms_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-supplies" data-group="offense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_ammo_container"></div>
        </div>
      </section>

      <!-- Defesa: armor, shield, alchemy — each its own part, same pairing rule as Ataque. -->
      <section class="l-section resume-group-section" id="resume-section-armor" data-group="defense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_armor_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-shield" data-group="defense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_shield_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section resume-span-full" id="resume-section-alchemy" data-group="defense">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_alchemy_container"></div>
        </div>
      </section>

      <!-- Habilidades: magic, skills, advantages, disadvantages — same pairing rule. -->
      <section class="l-section resume-group-section" id="resume-section-magic" data-group="abilities">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_magic_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-skills" data-group="abilities">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_skills_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-advantages" data-group="abilities">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_advantages_container"></div>
        </div>
      </section>

      <section class="l-section resume-group-section" id="resume-section-disadvantages" data-group="abilities">
        <div class="resume-row">
          <div class="resume-full-col" id="resume_disadvantages_container"></div>
        </div>
      </section>

      <!-- Info: weight, value, points/XP -->
      <section class="l-section resume-group-section" id="resume-section-weight" data-group="info">
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
      </section>

      <section class="l-section resume-group-section" id="resume-section-value" data-group="info">
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
      </section>

      <!-- Points/XP: a panel copy of the edit page's Pontos tab (kept in both places by design,
           see renderExperienceBar/renderResumePoints — the edit page loses nothing here). -->
      <section class="l-section resume-group-section resume-span-full" id="resume-section-points" data-group="info">
        <h3 class="resume-col-title" id="sec-resume-points-group"></h3>
        <div id="resume_bar_experience_panel"></div>
        <table class="resume-table">
          <tbody>
            <tr class="resume-expander-row" data-tbody-target="resume_points_tbody_panel">
              <td colspan="2">
                <button class="resume-expander-btn" aria-expanded="false" aria-label="Expandir">
                  <span class="resume-expander-arrow">&#8250;</span>
                  <span id="sec-resume-points-detail-panel"></span>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody id="resume_points_tbody_panel" class="resume-collapsible" hidden></tbody>
          <tbody>
            <tr class="resume-total-row">
              <td><strong id="lbl-resume-totalPoints-panel"></strong></td>
              <td class="col-num" id="resume_total_points_cell_panel"><strong>0</strong></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
`;

function applyResumeStaticLabels() {
  const setText = (id, text) => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
  };

  setText("sec-resume-attributes-group", t("resume.attributesGroupTitle"));
  setText("sec-resume-weight", t("resume.weightTitle"));
  setText("sec-resume-weight-detail", t("resume.weightDetail"));
  setText("sec-resume-value", t("resume.valueTitle"));
  setText("sec-resume-value-detail", t("resume.valueDetail"));
  setText("lbl-encumbrance", `${t("resume.encumbrance")}:`);
  setText("lbl-resume-totalWeight", t("resume.totalWeight"));
  setText("lbl-resume-totalValue", t("resume.totalValue"));
  setText("sec-resume-points-group", t("resume.pointsTitle"));
  setText("sec-resume-points-detail-panel", t("resume.pointsDetail"));
  setText("lbl-resume-totalPoints-panel", t("resume.totalPoints"));
  const coinsCarried = document.getElementById("lbl-resume-coins-carried");
  if (coinsCarried)
    coinsCarried.innerHTML = `${icon("coins-carried")} ${t("resume.coinsCarried")}`;
}

// Must run before anything that reads the panel: initViewMode() moves #tab-char-resume.
export function mountResumePanel(hostId = HOST_ID) {
  const host = document.getElementById(hostId);
  if (!host || document.getElementById(PANEL_ID)) return;

  host.innerHTML = RESUME_PANEL_HTML;
  applyResumeStaticLabels();
}

// Scoped to the panel node itself, not the document — #tab-char-resume moves between the edit
// host and the view-mode host (viewMode.js), but is the same node either way, so its own
// .l-section children are reachable from here regardless of which host currently holds it.
// Must run after mountResumePanel(): the panel (and its #resume-groupnav) has to exist first.
export function initResumeGroupNav() {
  const sectionsRoot = document.getElementById(PANEL_ID);
  if (!sectionsRoot) return;

  createGroupNav({
    navId: "resume-groupnav",
    sectionsRoot,
    manageSidebar: false,
  }).initGroupNav({
    layout: RESUME_LAYOUT,
    labels: LABELS.resumeNav,
    storageKey: STORAGE_KEYS.resumeGroup,
  });
}
