// Firearms plus the consumables they draw on: loaded rounds, ammo stores, alchemy.

import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { calcActualHp } from "../../engine/inventory/shared/durabilityUtils.js";
import {
  collapsibleHeader,
  bindCollapse,
  hpStepperCell,
  roundsStepperCell,
} from "./shared.js";

export function renderResumeFirearms(sheet) {
  const equipped = sheet?.inventory?.firearms?.equipped ?? [];
  const container = el("resume_firearms_container");
  if (!container) return;

  if (equipped.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = equipped
    .map((w) => {
      const baseMaxHp = w.weapon_final_hit_points ?? 0;
      const modifier = w.hit_points_modifier ?? 0;
      const actualHp = calcActualHp(baseMaxHp, modifier);
      const instanceId = w._instanceId ?? "";

      const hpCell =
        baseMaxHp > 0
          ? hpStepperCell({
              cssClass: "resume-firearm-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
              maxHp: baseMaxHp,
              modifier,
              actualHp,
            })
          : `<td></td>`;

      const magazineSize = w.weapon_final_magazine_size ?? 0;
      const roundsLoaded = w.rounds_loaded ?? 0;

      const roundsCell = roundsStepperCell({
        cssClass: "resume-firearm-rounds",
        dataAttrs: `data-instance-id="${instanceId}"`,
        magazineSize,
        roundsLoaded,
      });

      return `
        <tr>
          <td>${w.weapon_name ?? "—"}</td>
          <td class="col-num">${w.weapon_final_tr ?? "—"}</td>
          <td class="col-num">${w.weapon_final_prec ?? "—"}</td>
          <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
          ${hpCell}
          ${roundsCell}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("sections.firearms"))}
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
              <th class="col-num">${t("firearms.magazine")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}

// Quantities are aggregated across all equipped containers per ammo_id; the stepper
// writes back to the first equipped container (by insertion order) holding that ammo_id.
export function renderResumeAmmo(sheet, data, selected) {
  const equippedContainers = sheet?.inventory?.ammo?.containers?.equipped ?? [];
  const ammoDb = data?.ammo ?? [];
  const container = el("resume_ammo_container");
  if (!container) return;

  const entries = [];
  const equippedSelected = (selected?.ammo_containers ?? []).filter(
    (c) => c.storedAt === "equipped",
  );

  for (const cont of equippedContainers) {
    for (const item of cont.contents ?? []) {
      const dbRow = ammoDb.find((a) => a.ammo_id === item.ammo_id);
      const name = dbRow?.ammo_name ?? item.ammo_id;
      const existing = entries.find((e) => e.ammo_id === item.ammo_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        const firstInst = equippedSelected.find((c) =>
          c.contents.some((e) => e.ammo_id === item.ammo_id),
        );
        entries.push({
          ammo_id: item.ammo_id,
          name,
          quantity: item.quantity,
          instanceId: firstInst?._instanceId ?? "",
        });
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
        <td class="col-num">
          <div class="num-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="resume-ammo-qty"
              data-ammo-id="${e.ammo_id}"
              data-instance-id="${e.instanceId}"
              value="${e.quantity}"
              style="width:50px"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("sections.munition"))}
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
  bindCollapse(container);
}

export function renderResumeAlchemy(sheet) {
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
        <td class="col-num">
          <div class="num-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="alchemy-qty"
              data-consumable-id="${a.consumable_id}"
              data-stored-at="${a.storedAt}"
              value="${a.quantity ?? 1}"
              style="width:50px"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("alchemy.title"))}
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
  bindCollapse(container);
}
