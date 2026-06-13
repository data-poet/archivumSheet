import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
  getSecondaryAttributeLabel,
} from "../localization/pt-BR.js";
import { el } from "../shared/dom.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ARMOR_SLOTS = [
  { key: "head", label: "Cabeça" },
  { key: "torso", label: "Tronco" },
  { key: "arms", label: "Braços" },
  { key: "hands", label: "Mãos" },
  { key: "legs", label: "Pernas" },
  { key: "feet", label: "Pés" },
];

// ─────────────────────────────────────────────────────────────────────────────
// renderResume(sheet, data)
//   sheet  — engine output (state.sheet)
//   data   — raw DB arrays (state.data) — used for ammo name lookup
// ─────────────────────────────────────────────────────────────────────────────

export function renderResume(sheet, data = {}) {
  renderResumeHeader(sheet);
  renderResumeBars(sheet);
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
  const subRace = sheet?.race?.race_sub_name || "";
  const separator = charName && subRace ? " | " : "";

  nameEl.textContent = charName + separator + subRace;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HP / Mana / Toxicity bars
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeBars(sheet) {
  const attrs = sheet?.character?.secondary_attributes;
  if (!attrs) return;

  _renderBar("resume_bar_hp", attrs.HP, "resume-bar--hp");
  _renderBar("resume_bar_mana", attrs.Mana, "resume-bar--mana");
  _renderBar("resume_bar_toxicity", attrs.Toxicity, "resume-bar--toxicity");
}

function _renderBar(containerId, attr, modifierClass) {
  const container = el(containerId);
  if (!container || !attr) return;

  // total = base_value + bought * step (step is always 4 for these three)
  const total = (attr.base_value ?? 0) + (attr.bought ?? 0) * 4;
  // modifier is damage taken / spent — only shrink when negative
  const rawMod = attr.modifier ?? 0;
  const lost = rawMod < 0 ? Math.abs(rawMod) : 0;
  const current = Math.max(0, total - lost);

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const label = getSecondaryAttributeLabel(
    modifierClass === "resume-bar--hp"
      ? "HP"
      : modifierClass === "resume-bar--mana"
        ? "Mana"
        : "Toxicity",
  );

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
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Advantages & Disadvantages (collapsed tables)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeTraits(sheet) {
  const advantages = sheet?.character?.advantages || {};
  const disadvantages = sheet?.character?.disadvantages || {};

  const advEntries = Object.values(advantages);
  const disEntries = Object.values(disadvantages);

  _renderCollapsibleNameList(
    "resume_advantages_container",
    advEntries,
    t("resume.advantages"),
  );
  _renderCollapsibleNameList(
    "resume_disadvantages_container",
    disEntries,
    t("resume.disadvantages"),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Skills (collapsed table — name, value, actions)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeSkills(sheet) {
  const skills = sheet?.character?.skills || {};
  const entries = Object.values(skills);
  const container = el("resume_skills_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(
      (s) => `
      <tr>
        <td>${s.name ?? "—"}</td>
        <td class="col-num">${s.value ?? "—"}</td>
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
  const spells = sheet?.grimoire || {};
  const spellsDb = data?.spells ?? [];
  const entries = Object.entries(spells);
  const container = el("resume_magic_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(([id, s]) => {
      const dbRow = spellsDb.find((r) => r.spell_id === id);
      const cost = dbRow?.spell_cost ?? "—";
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
// 6. Equipped Armor (collapsed — slot | DR)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeArmor(sheet) {
  const equipped = sheet?.inventory?.armor?.equipped || {};
  const container = el("resume_armor_container");
  if (!container) return;

  // Check if any slot is filled
  const hasAny = ARMOR_SLOTS.some((s) => equipped[s.key] != null);
  if (!hasAny) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = ARMOR_SLOTS.map(({ key, label }) => {
    const piece = equipped[key];
    const dr = piece ? piece.armor_final_damage_resistance : "—";
    return `<tr><td>${label}</td><td class="col-num">${dr}</td></tr>`;
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
// 7. Equipped Shield (collapsed — name | DR | block)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeShield(sheet) {
  const equippedShield = sheet?.inventory?.shield?.equipped;
  const container = el("resume_shield_container");
  if (!container) return;

  if (!equippedShield) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const dr = equippedShield.shield_final_damage_resistance ?? "—";
  const block = equippedShield.block ?? "—";

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
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${equippedShield.shield_name ?? "—"}</td>
              <td class="col-num">${dr}</td>
              <td class="col-num">${block}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  _bindCollapse(container);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Equipped Melee (collapsed — name | BAL dmg | GDP dmg)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeMelee(sheet) {
  const equipped = sheet?.inventory?.melee?.equipped ?? [];
  const container = el("resume_melee_container");
  if (!container) return;

  if (equipped.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = equipped
    .map(
      (w) => `
      <tr>
        <td>${w.weapon_name ?? "—"}</td>
        <td class="col-num">${w.weapon_bal_damage ?? "—"}</td>
        <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${_collapsibleHeader(t("sections.melee"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("melee.balDmg")}</th>
              <th class="col-num">${t("melee.gdpDmg")}</th>
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
// 9. Equipped Ranged (collapsed — name | TR | PREC)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeRanged(sheet) {
  const equipped = sheet?.inventory?.ranged?.equipped ?? [];
  const container = el("resume_ranged_container");
  if (!container) return;

  if (equipped.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = equipped
    .map(
      (w) => `
      <tr>
        <td>${w.weapon_name ?? "—"}</td>
        <td class="col-num">${w.weapon_tr ?? "—"}</td>
        <td class="col-num">${w.weapon_prec ?? "—"}</td>
      </tr>
    `,
    )
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
  const ammoDb = data?.ammo ?? [];
  const container = el("resume_ammo_container");
  if (!container) return;

  // Collect all ammo entries across equipped containers
  const entries = [];
  for (const cont of equippedContainers) {
    for (const item of cont.contents ?? []) {
      const dbRow = ammoDb.find((a) => a.ammo_id === item.ammo_id);
      const name = dbRow?.ammo_name ?? item.ammo_id;
      // Merge same ammo_id across containers
      const existing = entries.find((e) => e.ammo_id === item.ammo_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        entries.push({ ammo_id: item.ammo_id, name, quantity: item.quantity });
      }
    }
  }

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
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
  const backpack = sheet?.inventory?.alchemy?.backpack ?? [];
  const container = el("resume_alchemy_container");
  if (!container) return;

  if (backpack.length === 0) {
    container.hidden = true;
    return;
  }
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
// Weight (existing logic, kept compatible)
// ─────────────────────────────────────────────────────────────────────────────

function renderResumeWeight(sheet) {
  const carry = sheet?.inventory?.carry_weight;

  const weightEl = el("weight");
  const baseWeight = weightEl ? Number(weightEl.value) || 0 : 0;

  const armorWeight = sheet?.inventory?.armor?.carried_armor_weight || 0;
  const shieldWeight = sheet?.inventory?.shield?.carried_shield_weight || 0;
  const meleeWeight =
    sheet?.inventory?.melee?.carried_melee_weapons_weight || 0;
  const rangedWeight =
    sheet?.inventory?.ranged?.carried_ranged_weapons_weight || 0;
  const ammoWeight = sheet?.inventory?.ammo?.carried_ammo_weight || 0;
  const alchemyWeight = sheet?.inventory?.alchemy?.carried_alchemy_weight || 0;
  const survivalGearWeight =
    sheet?.inventory?.survivalGear?.carried_survival_gear_weight || 0;
  const customWeight =
    sheet?.inventory?.customInventory?.carried_custom_inventory_weight || 0;
  const coinPurseWeight =
    sheet?.inventory?.coinPurse?.carried_coin_purse_weight || 0;

  const totalWeight =
    baseWeight +
    armorWeight +
    shieldWeight +
    meleeWeight +
    rangedWeight +
    ammoWeight +
    alchemyWeight +
    survivalGearWeight +
    customWeight +
    coinPurseWeight;

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

  // Legacy hidden spans
  const set = (id, val) => {
    const e = el(id);
    if (e) e.textContent = val;
  };
  set("armor_weight", armorWeight);
  set("shield_weight", shieldWeight);
  set("melee_weight", meleeWeight);
  set("ranged_weight", rangedWeight);
  set("ammo_weight", ammoWeight);
  set("alchemy_weight", alchemyWeight);
  set("survival_gear_weight", survivalGearWeight);
  set("custom_inventory_weight", customWeight);
  set("total_weight", totalWeight);
  set("encumbrance", encumbranceLabel);

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
  const armorValue = sheet?.inventory?.armor?.carried_armor_value || 0;
  const shieldValue = sheet?.inventory?.shield?.carried_shield_value || 0;
  const meleeValue = sheet?.inventory?.melee?.carried_melee_weapons_value || 0;
  const rangedValue =
    sheet?.inventory?.ranged?.carried_ranged_weapons_value || 0;
  const ammoValue = sheet?.inventory?.ammo?.carried_ammo_value || 0;
  const alchemyValue = sheet?.inventory?.alchemy?.carried_alchemy_value || 0;
  const survivalGearValue =
    sheet?.inventory?.survivalGear?.carried_survival_gear_value || 0;
  const customValue =
    sheet?.inventory?.customInventory?.carried_custom_inventory_value || 0;

  const totalValue =
    armorValue +
    shieldValue +
    meleeValue +
    rangedValue +
    ammoValue +
    alchemyValue +
    survivalGearValue +
    customValue;

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

  // ── Coins in backpack ─────────────────────────────────────────────────────
  const backpackCoins = sheet?.inventory?.coinPurse?.backpack ?? [];
  const totalCoins = backpackCoins.reduce(
    (sum, entry) => sum + (entry.total_value ?? 0),
    0,
  );
  const hasCoins = backpackCoins.length > 0;

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
  const primaryAttributesPoints =
    sheet?.character?.character_points?.primary_attributes ?? 0;
  const secondaryAttributesPoints =
    sheet?.character?.character_points?.secondary_attributes ?? 0;
  const advantagesPoints = sheet?.character?.character_points?.advantages ?? 0;
  const disadvantagesPoints =
    sheet?.character?.character_points?.disadvantages ?? 0;
  const skillsPoints = sheet?.character?.character_points?.skills ?? 0;
  const spellsPoints = sheet?.character?.character_points?.spells ?? 0;

  const totalPoints =
    primaryAttributesPoints +
    secondaryAttributesPoints +
    advantagesPoints +
    disadvantagesPoints +
    skillsPoints +
    spellsPoints;

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
  if (totalPointsCell) {
    totalPointsCell.innerHTML = `<strong>${totalPoints}</strong>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a simple collapsed list with only item names.
 * Hides the container when entries array is empty.
 */
function _renderCollapsibleNameList(containerId, entries, title) {
  const container = el(containerId);
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
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

/** Returns the HTML for a collapsible section header button. */
function _collapsibleHeader(title) {
  return `
    <button class="resume-section-toggle" type="button" aria-expanded="false">
      <span class="resume-expander-arrow">&#8250;</span>
      <span class="resume-section-title">${title}</span>
    </button>
  `;
}

/** Attaches toggle behaviour to a freshly rendered container. */
function _bindCollapse(container) {
  const btn = container.querySelector(".resume-section-toggle");
  const body = container.querySelector(".resume-collapse-body");
  if (!btn || !body) return;

  // Start collapsed
  body.hidden = true;
  btn.setAttribute("aria-expanded", "false");

  btn.addEventListener("click", () => {
    const isOpen = body.hidden === false;
    body.hidden = isOpen;
    btn.setAttribute("aria-expanded", String(!isOpen));
    const arrow = btn.querySelector(".resume-expander-arrow");
    if (arrow) arrow.classList.toggle("resume-expander-arrow--open", !isOpen);
  });
}
