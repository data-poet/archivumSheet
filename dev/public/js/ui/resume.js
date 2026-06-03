import { t, getEncumbranceLabel, getCarryLimitLabel } from "../localization/pt-BR.js";
import { el } from "../shared/dom.js";

// ─────────────────────────────────────────────────────────────────────────────
// renderResume
//
// Renders the "Resumo do Personagem" panel:
//   - Weight breakdown + encumbrance state (moved from the old Inventory box)
//   - Character points breakdown per category + grand total
//
// Called after every runEngine() resolve. Engine is the single source of truth.
// ─────────────────────────────────────────────────────────────────────────────

export function renderResume(sheet) {
  renderResumeWeight(sheet);
  renderResumePoints(sheet);
}

// ── Weight / Encumbrance ──────────────────────────────────────────────────────

function renderResumeWeight(sheet) {
  const carry = sheet?.inventory?.carry_weight;

  const weightEl = el("weight");
  const baseWeight = weightEl ? Number(weightEl.value) || 0 : 0;

  const armorWeight  = sheet?.inventory?.armor?.carried_armor_weight   || 0;
  const shieldWeight = sheet?.inventory?.shield?.carried_shield_weight || 0;
  const meleeWeight  = sheet?.inventory?.melee?.carried_melee_weight   || 0;
  const rangedWeight = sheet?.inventory?.ranged?.carried_ranged_weight || 0;
  const ammoWeight   = sheet?.inventory?.ammo?.carried_ammo_weight     || 0;
  const totalWeight  = baseWeight + armorWeight + shieldWeight + meleeWeight + rangedWeight + ammoWeight;

  // Encumbrance key
  let stateKey = "none";
  if (carry) {
    if      (totalWeight >= carry.limits.veryHeavy) stateKey = "overloaded";
    else if (totalWeight >= carry.limits.heavy)     stateKey = "veryHeavy";
    else if (totalWeight >= carry.limits.medium)    stateKey = "heavy";
    else if (totalWeight >= carry.limits.light)     stateKey = "medium";
    else if (totalWeight >  carry.limits.none)      stateKey = "light";
  }

  const encumbranceLabel = carry
    ? `${getEncumbranceLabel(stateKey)} (×${carry.weight_modifier})`
    : "—";

  // Weight rows tbody
  const weightTbody = el("resume_weight_tbody");
  if (weightTbody) {
    weightTbody.innerHTML = `
      <tr>
        <td>${t("resume.armorWeight")}</td>
        <td class="col-num">${armorWeight}</td>
      </tr>
      <tr>
        <td>${t("resume.shieldWeight")}</td>
        <td class="col-num">${shieldWeight}</td>
      </tr>
      <tr>
        <td>${t("resume.meleeWeight")}</td>
        <td class="col-num">${meleeWeight}</td>
      </tr>
      <tr>
        <td>${t("resume.rangedWeight")}</td>
        <td class="col-num">${rangedWeight}</td>
      </tr>
      <tr>
        <td>${t("ammo.ammoWeight")}</td>
        <td class="col-num">${ammoWeight}</td>
      </tr>
      <tr class="resume-total-row">
        <td><strong>${t("resume.totalWeight")}</strong></td>
        <td class="col-num"><strong>${totalWeight}</strong></td>
      </tr>
    `;
  }

  // Keep the legacy span IDs in sync so updateInventoryUI (called separately)
  // also works — just set the ones that live outside the resume table
  const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  set("armor_weight",  armorWeight);
  set("shield_weight", shieldWeight);
  set("melee_weight",  meleeWeight);
  set("ranged_weight", rangedWeight);
  set("ammo_weight",   ammoWeight);
  set("total_weight",  totalWeight);
  set("encumbrance", encumbranceLabel);

  // Carry limits table
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

// ── Character Points ──────────────────────────────────────────────────────────

function renderResumePoints(sheet) {
  const pts = sheet?.character?.character_points;
  const pointsTbody = el("resume_points_tbody");
  if (!pointsTbody) return;

  const rows = [
    { label: t("resume.primaryAttributes"),   value: pts?.primary_attributes   ?? 0 },
    { label: t("resume.secondaryAttributes"),  value: pts?.secondary_attributes ?? 0 },
    { label: t("resume.advantages"),           value: pts?.advantages           ?? 0 },
    { label: t("resume.disadvantages"),        value: pts?.disadvantages        ?? 0 },
    { label: t("resume.skills"),               value: pts?.skills               ?? 0 },
    { label: t("resume.spells"),               value: pts?.spells               ?? 0 },
  ];

  const total = rows.reduce((sum, r) => sum + Number(r.value || 0), 0);

  pointsTbody.innerHTML =
    rows.map(r => `
      <tr>
        <td>${r.label}</td>
        <td class="col-num resume-points-value">${r.value}</td>
      </tr>
    `).join("") +
    `<tr class="resume-total-row">
      <td><strong>${t("resume.total")}</strong></td>
      <td class="col-num resume-points-value"><strong>${total}</strong></td>
    </tr>`;
}
