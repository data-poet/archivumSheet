import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
  getSecondaryAttributeLabel,
} from "../localization/pt-BR.js";
import { el } from "../shared/dom.js";
import { calcMaxHp, calcActualHp } from "../shared/durabilityUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// Collapse state — module-level Map keyed by section title text.
// Bodies stay in the DOM (element.hidden); state survives re-renders because
// renderResume() writes into existing containers, not via innerHTML on the
// root panel. _bindCollapse() is only called on newly created containers.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Map<string, boolean>} title → true when open */
const _collapseOpen = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ARMOR_SLOTS = [
  { key: "head",  label: "Cabeça" },
  { key: "torso", label: "Tronco" },
  { key: "arms",  label: "Braços" },
  { key: "hands", label: "Mãos" },
  { key: "legs",  label: "Pernas" },
  { key: "feet",  label: "Pés" },
];

// ─────────────────────────────────────────────────────────────────────────────
// renderResume(sheet, data)
//   sheet  — engine output (state.sheet)
//   data   — raw DB arrays (state.data) — used for ammo name lookup
// ─────────────────────────────────────────────────────────────────────────────

export function renderResume(sheet, data = {}) {
  initResumeExpanders(); // no-op after first call

  renderResumeHeader(sheet);
  renderResumePrimaryAttributes(sheet);
  renderResumeBars(sheet);
  renderResumeSecondarySnapshot(sheet);
  renderResumeTraits(sheet);
  renderResumeSkills(sheet);
  renderResumeMagic(sheet, data);
  renderResumeArmor(sheet);
  renderResumeShield(sheet);
  renderResumeMelee(sheet);
  renderResumeRanged(sheet);
  renderResumeAmmo(sheet, data);
  renderResumeAlchemy(sheet);
  renderResumeWeight(sheet);
  renderResumeValue(sheet);
  renderResumePoints(sheet);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Header — character name | sub-race
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeHeader(sheet) {
  const nameEl = el("resume_header_name");
  if (!nameEl) return;

  const charName = sheet?.pc?.character_name || "";
  const subRace  = sheet?.race?.race_sub_name || "";
  const separator = charName && subRace ? " | " : "";

  nameEl.textContent = charName + separator + subRace;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1b. Primary attribute boxes (ST / DX / IQ / HT)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumePrimaryAttributes(sheet) {
  const container = el("resume_primary_attrs");
  if (!container) return;

  const primary = sheet?.character?.primary_attributes;
  if (!primary) { container.innerHTML = ""; return; }

  const attrs = ["ST", "DX", "IQ", "HT"];

  container.innerHTML = attrs
    .map((key) => {
      const value   = primary[key]?.value ?? "—";
      const modVal  = primary[key]?.modifier ?? 0;
      return `
        <div class="resume-attr-box">
          <span class="resume-attr-acronym">${key}</span>
          <span class="resume-attr-value">${value}</span>
          <div class="num-stepper resume-attr-mod-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="resume-primary-mod-input"
              data-attr="${key}"
              value="${modVal}"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1c. Secondary attributes snapshot
// ─────────────────────────────────────────────────────────────────────────────

const SECONDARY_SNAPSHOT_KEYS = [
  "Will", "Vision", "Hearing", "Smell", "BasicSpeed", "Movement", "Dodge",
];

function renderResumeSecondarySnapshot(sheet) {
  const container = el("resume_secondary_snapshot");
  if (!container) return;

  const sec = sheet?.character?.secondary_attributes;
  if (!sec) { container.innerHTML = ""; return; }

  const rows = SECONDARY_SNAPSHOT_KEYS.map((key) => {
    const attr = sec[key];
    if (!attr) return "";
    const isBasicSpeed = key === "BasicSpeed";
    const value =
      isBasicSpeed
        ? Number(attr.value).toFixed(2)
        : (attr.value ?? "—");
    const modifierStep = isBasicSpeed ? 0.5 : 1;
    const rawMod = attr.modifier ?? 0;

    return `
      <tr>
        <td>${getSecondaryAttributeLabel(key)}</td>
        <td class="col-num">${value}</td>
        <td>
          <div class="num-stepper resume-secondary-mod-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="secondary-input"
              data-name="${key}"
              data-field="modifier"
              data-step="${modifierStep}"
              value="${rawMod}"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("resume.secondarySnapshot"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--secondary-snapshot">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HP / Mana / Toxicity bars — with stepper for modifier
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeBars(sheet) {
  const attrs = sheet?.character?.secondary_attributes;
  if (!attrs) return;

  _renderBar("resume_bar_hp",       attrs.HP,       "resume-bar--hp",       "HP");
  _renderBar("resume_bar_mana",     attrs.Mana,     "resume-bar--mana",     "Mana");
  _renderBar("resume_bar_toxicity", attrs.Toxicity, "resume-bar--toxicity", "Toxicity");
}

function _renderBar(containerId, attr, modifierClass, attrName) {
  const container = el(containerId);
  if (!container || !attr) return;

  const total   = attr.final_base_value ?? ((attr.base_value ?? 0) + (attr.bought ?? 0) * 4);
  const rawMod  = attr.modifier ?? 0;
  const lost    = rawMod < 0 ? Math.abs(rawMod) : 0;
  const current = Math.max(0, total - lost);
  const pct     = total > 0 ? Math.round((current / total) * 100) : 0;
  const label   = getSecondaryAttributeLabel(attrName);

  container.innerHTML = `
    <div class="resume-bar-header">
      <span class="resume-bar-label">${label}</span>
      <span class="resume-bar-values">${current}/${total}</span>
    </div>
    <div class="resume-bar-track">
      <div
        class="resume-bar-fill ${modifierClass}"
        style="width: ${pct}%"
        role="progressbar"
        aria-valuenow="${current}"
        aria-valuemin="0"
        aria-valuemax="${total}"
      ></div>
    </div>
    <div class="resume-bar-stepper">
      <div class="num-stepper">
        <input
          type="text"
          inputmode="numeric"
          class="secondary-input"
          data-name="${attrName}"
          data-field="modifier"
          value="${rawMod}"
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
          <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Advantages & Disadvantages (collapsed tables)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeTraits(sheet) {
  const advantages    = sheet?.character?.advantages    || {};
  const disadvantages = sheet?.character?.disadvantages || {};

  _renderCollapsibleNameList(
    "resume_advantages_container",
    Object.values(advantages),
    t("resume.advantages"),
  );
  _renderCollapsibleNameList(
    "resume_disadvantages_container",
    Object.values(disadvantages),
    t("resume.disadvantages"),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Skills (collapsed table — name | value | parry | actions)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeSkills(sheet) {
  const skills  = sheet?.character?.skills || {};
  const entries = Object.values(skills);
  const container = el("resume_skills_container");
  if (!container) return;

  if (entries.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = entries
    .map(
      (s) => `
      <tr>
        <td>${s.name ?? "—"}</td>
        <td class="col-num">${s.value ?? "—"}</td>
        <td class="col-num">${s.parry != null ? s.parry : "—"}</td>
        <td class="col-num">${s.actions ?? "—"}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("resume.skills"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--skills">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("traits.final")}</th>
              <th class="col-num">${t("traits.parry")}</th>
              <th class="col-num">${t("traits.actions")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Magic (collapsed table — spell name, cost, value)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeMagic(sheet, data) {
  const spells   = sheet?.grimoire || {};
  const spellsDb = data?.spells ?? [];
  const entries  = Object.entries(spells);
  const container = el("resume_magic_container");
  if (!container) return;

  if (entries.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = entries
    .map(([id, s]) => {
      const dbRow = spellsDb.find((r) => r.spell_id === id);
      const cost  = dbRow?.spell_cost ?? "—";
      return `
        <tr>
          <td>${s.name ?? "—"}</td>
          <td class="col-num">${cost}</td>
          <td class="col-num">${s.value ?? "—"}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("resume.spells"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--magic">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("traits.spellCost")}</th>
              <th class="col-num">${t("traits.final")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Equipped Armor (collapsed — slot | DR | HP stepper)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeArmor(sheet) {
  const equipped  = sheet?.inventory?.armor?.equipped || {};
  const container = el("resume_armor_container");
  if (!container) return;

  const hasAny = ARMOR_SLOTS.some((s) => equipped[s.key] != null);
  if (!hasAny) { container.hidden = true; return; }
  container.hidden = false;

  const rows = ARMOR_SLOTS.map(({ key, label }) => {
    const piece = equipped[key];
    if (!piece) {
      return `<tr><td>${label}</td><td class="col-num">—</td><td></td></tr>`;
    }
    const dr        = piece.armor_final_damage_resistance ?? "—";
    const maxHp     = piece.armor_final_hit_points ?? 0;
    const modifier  = piece.hit_points_modifier ?? 0;
    const actualHp  = calcActualHp(maxHp, modifier);
    const hpCell    = maxHp > 0
      ? _hpStepperCell({
          cssClass:  "resume-armor-hp",
          dataAttrs: `data-slot="${label}"`,
          maxHp,
          modifier,
          actualHp,
        })
      : `<td></td>`;

    return `<tr><td>${label}</td><td class="col-num">${dr}</td>${hpCell}</tr>`;
  }).join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.armor"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("armor.slot")}</th>
              <th class="col-num">${t("armor.dr")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Equipped Shield (collapsed — name | DR | block | HP stepper)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeShield(sheet) {
  const equippedShield = sheet?.inventory?.shield?.equipped;
  const container      = el("resume_shield_container");
  if (!container) return;

  if (!equippedShield) { container.hidden = true; return; }
  container.hidden = false;

  const dr       = equippedShield.shield_final_damage_resistance ?? "—";
  const block    = equippedShield.block ?? "—";
  const maxHp    = equippedShield.shield_final_hit_points ?? 0;
  const modifier = equippedShield.hit_points_modifier ?? 0;
  const actualHp = calcActualHp(maxHp, modifier);

  const hpCell = maxHp > 0
    ? _hpStepperCell({
        cssClass:  "resume-shield-hp",
        dataAttrs: "",
        maxHp,
        modifier,
        actualHp,
      })
    : `<td></td>`;

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.shields"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("shield.dr")}</th>
              <th class="col-num">${t("shield.block")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${equippedShield.shield_name ?? "—"}</td>
              <td class="col-num">${dr}</td>
              <td class="col-num">${block}</td>
              ${hpCell}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Equipped Melee (collapsed — name | reach | BAL dmg | GDP dmg | HP stepper)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeMelee(sheet) {
  const equipped  = sheet?.inventory?.melee?.equipped ?? [];
  const container = el("resume_melee_container");
  if (!container) return;

  if (equipped.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = equipped
    .map((w) => {
      const maxHp    = w.final_hit_points != null
        ? w.final_hit_points - (w.hit_points_modifier ?? 0)
        : 0;
      // final_hit_points = maxHp + modifier, so maxHp = final - modifier
      // but safer to use weapon_final_hit_points from resolver if available
      const baseMaxHp  = w.weapon_final_hit_points ?? maxHp;
      const modifier   = w.hit_points_modifier ?? 0;
      const actualHp   = calcActualHp(baseMaxHp, modifier);
      const instanceId = w._instanceId ?? "";

      const hpCell = baseMaxHp > 0
        ? _hpStepperCell({
            cssClass:  "resume-melee-hp",
            dataAttrs: `data-instance-id="${instanceId}"`,
            maxHp:     baseMaxHp,
            modifier,
            actualHp,
          })
        : `<td></td>`;

      return `
        <tr>
          <td>${w.weapon_name ?? "—"}</td>
          <td class="col-num">${w.weapon_reach ?? "—"}</td>
          <td class="col-num">${w.weapon_bal_damage ?? "—"}</td>
          <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
          ${hpCell}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.melee"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("melee.reach")}</th>
              <th class="col-num">${t("melee.balDmg")}</th>
              <th class="col-num">${t("melee.gdpDmg")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Equipped Ranged (collapsed — name | TR | PREC | HP stepper)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeRanged(sheet) {
  const equipped  = sheet?.inventory?.ranged?.equipped ?? [];
  const container = el("resume_ranged_container");
  if (!container) return;

  if (equipped.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = equipped
    .map((w) => {
      const baseMaxHp  = w.weapon_final_hit_points ?? 0;
      const modifier   = w.hit_points_modifier ?? 0;
      const actualHp   = calcActualHp(baseMaxHp, modifier);
      const instanceId = w._instanceId ?? "";

      const hpCell = baseMaxHp > 0
        ? _hpStepperCell({
            cssClass:  "resume-ranged-hp",
            dataAttrs: `data-instance-id="${instanceId}"`,
            maxHp:     baseMaxHp,
            modifier,
            actualHp,
          })
        : `<td></td>`;

      return `
        <tr>
          <td>${w.weapon_name ?? "—"}</td>
          <td class="col-num">${w.weapon_tr ?? "—"}</td>
          <td class="col-num">${w.weapon_prec ?? "—"}</td>
          <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
          ${hpCell}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.ranged"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("ranged.tr")}</th>
              <th class="col-num">${t("ranged.prec")}</th>
              <th class="col-num">${t("ranged.gdpDmg")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Ammo — equipped containers only (collapsed — name | qty)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeAmmo(sheet, data) {
  const equippedContainers = sheet?.inventory?.ammo?.containers?.equipped ?? [];
  const ammoDb  = data?.ammo ?? [];
  const container = el("resume_ammo_container");
  if (!container) return;

  const entries = [];
  for (const cont of equippedContainers) {
    for (const item of cont.contents ?? []) {
      const dbRow = ammoDb.find((a) => a.ammo_id === item.ammo_id);
      const name  = dbRow?.ammo_name ?? item.ammo_id;
      const existing = entries.find((e) => e.ammo_id === item.ammo_id);
      if (existing) existing.quantity += item.quantity;
      else entries.push({ ammo_id: item.ammo_id, name, quantity: item.quantity });
    }
  }

  if (entries.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = entries
    .map(
      (e) => `
      <tr>
        <td>${e.name}</td>
        <td class="col-num">${e.quantity}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.munition"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("ammo.qty")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Alchemy (collapsed — name | tier | qty)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeAlchemy(sheet) {
  const backpack  = sheet?.inventory?.alchemy?.backpack ?? [];
  const container = el("resume_alchemy_container");
  if (!container) return;

  if (backpack.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = backpack
    .map(
      (a) => `
      <tr>
        <td>${a.consumable_name ?? "—"}</td>
        <td class="col-num">${a.consumable_tier ?? "—"}</td>
        <td class="col-num">${a.quantity ?? 1}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("alchemy.title"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("common.tier")}</th>
              <th class="col-num">${t("alchemy.qty")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// Weight
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeWeight(sheet) {
  const carry = sheet?.inventory?.carry_weight;

  const weightEl        = el("weight");
  const baseWeight      = weightEl ? Number(weightEl.value) || 0 : 0;

  const armorWeight        = sheet?.inventory?.armor?.carried_armor_weight        || 0;
  const shieldWeight       = sheet?.inventory?.shield?.carried_shield_weight      || 0;
  const meleeWeight        = sheet?.inventory?.melee?.carried_melee_weapons_weight || 0;
  const rangedWeight       = sheet?.inventory?.ranged?.carried_ranged_weapons_weight || 0;
  const ammoWeight         = sheet?.inventory?.ammo?.carried_ammo_weight          || 0;
  const alchemyWeight      = sheet?.inventory?.alchemy?.carried_alchemy_weight    || 0;
  const survivalGearWeight = sheet?.inventory?.survivalGear?.carried_survival_gear_weight || 0;
  const customWeight       = sheet?.inventory?.customInventory?.carried_custom_inventory_weight || 0;
  const coinPurseWeight    = sheet?.inventory?.coinPurse?.carried_coin_purse_weight || 0;

  const totalWeight =
    Math.ceil(
      (baseWeight +
        armorWeight +
        shieldWeight +
        meleeWeight +
        rangedWeight +
        ammoWeight +
        alchemyWeight +
        survivalGearWeight +
        customWeight +
        coinPurseWeight) *
        1000,
    ) / 1000;

  let stateKey = "none";
  if (carry) {
    if (totalWeight >= carry.limits.veryHeavy) stateKey = "overloaded";
    else if (totalWeight >= carry.limits.heavy) stateKey = "veryHeavy";
    else if (totalWeight >= carry.limits.medium) stateKey = "heavy";
    else if (totalWeight >= carry.limits.light) stateKey = "medium";
    else if (totalWeight > carry.limits.none) stateKey = "light";
  }

  const encumbranceLabel = carry
    ? `${getEncumbranceLabel(stateKey)} (×${carry.weight_modifier})`
    : "—";

  const weightTbody = el("resume_weight_tbody");
  if (weightTbody) {
    weightTbody.innerHTML = `
      <tr><td>${t("resume.armorWeight")}</td><td class="col-num">${armorWeight}</td></tr>
      <tr><td>${t("resume.shieldWeight")}</td><td class="col-num">${shieldWeight}</td></tr>
      <tr><td>${t("resume.meleeWeight")}</td><td class="col-num">${meleeWeight}</td></tr>
      <tr><td>${t("resume.rangedWeight")}</td><td class="col-num">${rangedWeight}</td></tr>
      <tr><td>${t("ammo.ammoWeight")}</td><td class="col-num">${ammoWeight}</td></tr>
      <tr><td>${t("alchemy.alchemyWeight")}</td><td class="col-num">${alchemyWeight}</td></tr>
      <tr><td>${t("survivalGear.survivalGearWeight")}</td><td class="col-num">${survivalGearWeight}</td></tr>
      <tr><td>${t("customInventory.customInventoryWeight")}</td><td class="col-num">${customWeight}</td></tr>
      <tr><td>${t("coinPurse.coinPurseWeight")}</td><td class="col-num">${coinPurseWeight}</td></tr>
    `;
  }

  const totalWeightCell = el("resume_total_weight_cell");
  if (totalWeightCell)
    totalWeightCell.innerHTML = `<strong>${totalWeight}</strong>`;

  const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  set("armor_weight",          armorWeight);
  set("shield_weight",         shieldWeight);
  set("melee_weight",          meleeWeight);
  set("ranged_weight",         rangedWeight);
  set("ammo_weight",           ammoWeight);
  set("alchemy_weight",        alchemyWeight);
  set("survival_gear_weight",  survivalGearWeight);
  set("custom_inventory_weight", customWeight);
  set("total_weight",          totalWeight);
  set("encumbrance",           encumbranceLabel);

  const limitsEl = el("carry_limits");
  if (limitsEl && carry) {
    limitsEl.innerHTML = `
      <table class="resume-limits-table">
        <thead>
          <tr>
            <th>${getCarryLimitLabel("none")}</th>
            <th>${getCarryLimitLabel("light")}</th>
            <th>${getCarryLimitLabel("medium")}</th>
            <th>${getCarryLimitLabel("heavy")}</th>
            <th>${getCarryLimitLabel("veryHeavy")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-num">${carry.limits.none}</td>
            <td class="col-num">${carry.limits.light}</td>
            <td class="col-num">${carry.limits.medium}</td>
            <td class="col-num">${carry.limits.heavy}</td>
            <td class="col-num">${carry.limits.veryHeavy}</td>
          </tr>
        </tbody>
      </table>
    `;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Value resume
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeValue(sheet) {
  const armorValue        = sheet?.inventory?.armor?.carried_armor_value        || 0;
  const shieldValue       = sheet?.inventory?.shield?.carried_shield_value      || 0;
  const meleeValue        = sheet?.inventory?.melee?.carried_melee_weapons_value || 0;
  const rangedValue       = sheet?.inventory?.ranged?.carried_ranged_weapons_value || 0;
  const ammoValue         = sheet?.inventory?.ammo?.carried_ammo_value          || 0;
  const alchemyValue      = sheet?.inventory?.alchemy?.carried_alchemy_value    || 0;
  const survivalGearValue = sheet?.inventory?.survivalGear?.carried_survival_gear_value || 0;
  const customValue       = sheet?.inventory?.customInventory?.carried_custom_inventory_value || 0;

  const totalValue =
    armorValue + shieldValue + meleeValue + rangedValue +
    ammoValue + alchemyValue + survivalGearValue + customValue;

  const valueTbody = el("resume_value_tbody");
  if (valueTbody) {
    valueTbody.innerHTML = `
      <tr><td>${t("resume.armorWeight")}</td><td class="col-num">${armorValue}</td></tr>
      <tr><td>${t("resume.shieldWeight")}</td><td class="col-num">${shieldValue}</td></tr>
      <tr><td>${t("resume.meleeWeight")}</td><td class="col-num">${meleeValue}</td></tr>
      <tr><td>${t("resume.rangedWeight")}</td><td class="col-num">${rangedValue}</td></tr>
      <tr><td>${t("ammo.ammoWeight")}</td><td class="col-num">${ammoValue}</td></tr>
      <tr><td>${t("alchemy.alchemyWeight")}</td><td class="col-num">${alchemyValue}</td></tr>
      <tr><td>${t("survivalGear.survivalGearWeight")}</td><td class="col-num">${survivalGearValue}</td></tr>
      <tr><td>${t("customInventory.customInventoryWeight")}</td><td class="col-num">${customValue}</td></tr>
    `;
  }

  const totalValueCell = el("resume_total_value_cell");
  if (totalValueCell)
    totalValueCell.innerHTML = `<strong>${totalValue}</strong>`;

  const backpackCoins = sheet?.inventory?.coinPurse?.backpack ?? [];
  const totalCoins    = backpackCoins.reduce((sum, entry) => sum + (entry.total_value ?? 0), 0);
  const hasCoins      = backpackCoins.length > 0;

  const coinsRowEl = el("resume_coins_row");
  if (coinsRowEl) coinsRowEl.hidden = !hasCoins;

  document.querySelectorAll(".resume-coins-value").forEach((span) => {
    span.textContent = totalCoins.toLocaleString("pt-BR");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Character Points
// ─────────────────────────────────────────────────────────────────────────────

function renderResumePoints(sheet) {
  const primaryAttributesPoints   = sheet?.character?.character_points?.primary_attributes   ?? 0;
  const secondaryAttributesPoints = sheet?.character?.character_points?.secondary_attributes ?? 0;
  const advantagesPoints          = sheet?.character?.character_points?.advantages           ?? 0;
  const disadvantagesPoints       = sheet?.character?.character_points?.disadvantages        ?? 0;
  const skillsPoints              = sheet?.character?.character_points?.skills               ?? 0;
  const spellsPoints              = sheet?.character?.character_points?.spells               ?? 0;

  const totalPoints =
    primaryAttributesPoints + secondaryAttributesPoints +
    advantagesPoints + disadvantagesPoints +
    skillsPoints + spellsPoints;

  const pointsTbody = el("resume_points_tbody");
  if (pointsTbody) {
    pointsTbody.innerHTML = `
      <tr><td>${t("resume.primaryAttributes")}</td><td class="col-num">${primaryAttributesPoints}</td></tr>
      <tr><td>${t("resume.secondaryAttributes")}</td><td class="col-num">${secondaryAttributesPoints}</td></tr>
      <tr><td>${t("resume.advantages")}</td><td class="col-num">${advantagesPoints}</td></tr>
      <tr><td>${t("resume.disadvantages")}</td><td class="col-num">${disadvantagesPoints}</td></tr>
      <tr><td>${t("resume.skills")}</td><td class="col-num">${skillsPoints}</td></tr>
      <tr><td>${t("resume.spells")}</td><td class="col-num">${spellsPoints}</td></tr>
    `;
  }

  const totalPointsCell = el("resume_total_points_cell");
  if (totalPointsCell) totalPointsCell.innerHTML = `<strong>${totalPoints}</strong>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a <td> containing the HP stepper + max/current display.
 * Reuses .hp-modifier + .num-stepper pattern from edit-mode equipment renders.
 */
function _hpStepperCell({ cssClass, dataAttrs, maxHp, modifier, actualHp }) {
  return `
    <td>
      <div class="hp-modifier">
        <div class="num-stepper">
          <input
            type="text"
            inputmode="numeric"
            class="${cssClass}"
            ${dataAttrs}
            value="${modifier}"
          />
          <div class="stepper-btns">
            <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
            <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
          </div>
        </div>
        <strong class="resume-hp-actual">${actualHp}</strong>/<strong>${maxHp}</strong>
      </div>
    </td>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible section helpers
//
// State lives in the module-level _collapseOpen Map (keyed by title text).
// Bodies stay permanently in the DOM with `hidden` toggled — no snapshot or
// restore is needed across re-renders because each _bindCollapse call reads
// the Map and applies the current state immediately after innerHTML is set.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the toggle button HTML string.
 */
function _collapsibleHeader(title) {
  return `
    <button class="resume-section-toggle" type="button" aria-expanded="false">
      <span class="resume-expander-arrow">&#8250;</span>
      <span class="resume-section-title">${title}</span>
    </button>
  `;
}

/**
 * Apply persisted open/closed state from _collapseOpen to a freshly
 * rendered container. Called immediately after setting container.innerHTML.
 *
 * @param {Element} container
 */
function _bindCollapse(container) {
  const btn  = container.querySelector(".resume-section-toggle");
  const body = container.querySelector(".resume-collapse-body");
  if (!btn || !body) return;

  const title  = btn.querySelector(".resume-section-title")?.textContent ?? "";
  const isOpen = _collapseOpen.get(title) ?? false;

  body.hidden = !isOpen;
  btn.setAttribute("aria-expanded", String(isOpen));
  const arrow = btn.querySelector(".resume-expander-arrow");
  if (arrow) arrow.classList.toggle("resume-expander-arrow--open", isOpen);
}

function _renderCollapsibleNameList(containerId, entries, title) {
  const container = el(containerId);
  if (!container) return;

  if (entries.length === 0) { container.hidden = true; return; }
  container.hidden = false;

  const rows = entries
    .map((item) => `<tr><td>${item.name ?? "—"}</td></tr>`)
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(title)}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

let _expandersBound = false;
export function initResumeExpanders() {
  if (_expandersBound) return;
  _expandersBound = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".resume-section-toggle");
    if (!btn) return;
    const parent = btn.parentElement;
    if (!parent) return;
    const body = parent.querySelector(".resume-collapse-body");
    if (!body) return;

    const isOpen = body.hidden === false;
    const title  = btn.querySelector(".resume-section-title")?.textContent ?? "";

    body.hidden = isOpen;
    btn.setAttribute("aria-expanded", String(!isOpen));
    const arrow = btn.querySelector(".resume-expander-arrow");
    if (arrow) arrow.classList.toggle("resume-expander-arrow--open", !isOpen);

    // Persist new state into module Map
    _collapseOpen.set(title, !isOpen);
  });
}
