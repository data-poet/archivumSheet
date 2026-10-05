// Firearms plus the consumables they draw on: loaded rounds, ammo stores, alchemy.

import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import {
  collapsibleHeader,
  bindCollapse,
  quantityStepperCell,
  roundsStepperCell,
  renderResumeWeaponTable,
} from "./shared.js";

export function renderResumeFirearms(sheet, { editable = true } = {}) {
  renderResumeWeaponTable({
    containerId: "resume_firearms_container",
    title: t("sections.firearms"),
    weapons: sheet?.inventory?.firearms?.equipped ?? [],
    hpCssClass: "resume-firearm-hp",
    computeMaxHp: (w) => w.weapon_final_hit_points ?? 0,
    editable,
    columns: [
      { header: t("ranged.tr"), cell: (w) => w.weapon_final_tr ?? "—" },
      { header: t("ranged.prec"), cell: (w) => w.weapon_final_prec ?? "—" },
      { header: t("ranged.gdpDmg"), cell: (w) => w.weapon_gdp_damage ?? "—" },
    ],
    extraHeader: `<th class="col-num">${t("firearms.magazine")}</th>`,
    extraCell: (w, instanceId) =>
      roundsStepperCell({
        cssClass: "resume-firearm-rounds",
        dataAttrs: `data-instance-id="${instanceId}"`,
        magazineSize: w.weapon_final_magazine_size ?? 0,
        roundsLoaded: w.rounds_loaded ?? 0,
        editable,
      }),
  });
}

// Quantities are aggregated across all equipped containers per ammo_id; the stepper
// writes back to the first equipped container (by insertion order) holding that ammo_id.
export function renderResumeAmmo(
  sheet,
  data,
  selected,
  { editable = true } = {},
) {
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
          instanceId: firstInst?.id ?? "",
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
        ${quantityStepperCell({
          cssClass: "resume-ammo-qty",
          dataAttrs: `data-ammo-id="${e.ammo_id}" data-instance-id="${e.instanceId}"`,
          quantity: e.quantity,
          editable,
        })}
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
