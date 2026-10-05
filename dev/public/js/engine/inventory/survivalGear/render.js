import { t } from "../../../localization/pt-BR/index.js";
import { setHTML } from "../../../shared/dom.js";
import {
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
} from "../../../shared/constants.js";
import {
  detailRow,
  formatRichText,
  cardTitleCell,
} from "../../../shared/renderUtils.js";
import { renderStorageLocationBlock } from "../shared/inventoryRenderUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getGearRecord(gearId, survivalGearData) {
  return survivalGearData.find((g) => g.adventure_gear_id === gearId) ?? null;
}

function gearDetailFields(record) {
  if (!record) return [];
  return [
    { label: t("common.type"), value: record.adventure_gear_type ?? "—" },
    {
      label: t("common.price"),
      value:
        record.adventure_gear_price != null
          ? String(record.adventure_gear_price)
          : "—",
    },
    {
      label: t("common.weight"),
      value:
        record.adventure_gear_weight != null
          ? String(record.adventure_gear_weight)
          : "—",
    },
    {
      label: t("survivalGear.observation"),
      value: formatRichText(record.adventure_gear_observation),
      rich: true,
    },
  ];
}

function survivalGearLocationSelect(gearId, currentLocation) {
  const options = STORAGE_LOCATIONS.map(
    (loc) =>
      `<option value="${loc}" ${loc === currentLocation ? "selected" : ""}>${t(`storage.${loc}`)}</option>`,
  ).join("");
  return `<select
    class="survival-gear-location-select"
    data-gear-id="${gearId}"
    data-stored-at="${currentLocation}"
  >${options}</select>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────────────────────────────────────

export function renderSurvivalGear(selected, data, sheet) {
  const entries = selected.survivalGear ?? [];
  const survivalGearData = data.survivalGear ?? [];

  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderSurvivalGearSection(loc, entries, survivalGearData, sheet),
  ).join("");

  setHTML("survivalGearList", sections);
}

// Each gear item is stored as one row per unit; group them back into one display
// row per adventure_gear_id so the qty stepper still shows a single combined count.
function groupByGear(sectionEntries) {
  const groups = new Map();
  for (const entry of sectionEntries) {
    const group = groups.get(entry.adventure_gear_id);
    if (group) {
      group.quantity += entry.quantity;
    } else {
      groups.set(entry.adventure_gear_id, {
        adventure_gear_id: entry.adventure_gear_id,
        quantity: entry.quantity,
      });
    }
  }
  return [...groups.values()];
}

function renderSurvivalGearSection(location, entries, survivalGearData, sheet) {
  const sectionEntries = groupByGear(
    entries.filter((e) => e.storedAt === location),
  );

  let bodyRows = "";

  if (sectionEntries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="4">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = sectionEntries
      .map((entry) => {
        const record = getGearRecord(entry.adventure_gear_id, survivalGearData);
        const name = record?.adventure_gear_name ?? entry.adventure_gear_id;
        const resolvedBucket = sheet?.inventory?.survivalGear?.[location];
        const totalWeight = resolvedBucket
          ? Math.round(
              (resolvedBucket
                .filter((e) => e.adventure_gear_id === entry.adventure_gear_id)
                .reduce((sum, e) => sum + e.total_weight, 0) +
                Number.EPSILON) *
                100,
            ) / 100
          : "—";

        return `
          <tr>
            ${cardTitleCell(name)}
            <td class="col-num" data-label="${t("survivalGear.qty")}">
              <div class="num-stepper">
                <input
                  type="text"
                  inputmode="numeric"
                  class="survival-gear-qty"
                  data-gear-id="${entry.adventure_gear_id}"
                  data-stored-at="${location}"
                  value="${entry.quantity}"
                  style="width:50px"
                />
                <div class="stepper-btns">
                  <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                  <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
                </div>
              </div>
            </td>
            <td class="col-num" data-label="${t("common.weight")}">${totalWeight}</td>
            <td class="col-action">
              ${survivalGearLocationSelect(entry.adventure_gear_id, location)}
              <button
                class="btn-remove remove-survival-gear"
                data-gear-id="${entry.adventure_gear_id}"
                data-stored-at="${location}"
              >✕</button>
            </td>
          </tr>
          ${detailRow(4, gearDetailFields(record))}`;
      })
      .join("");
  }

  return renderStorageLocationBlock(
    location,
    STORAGE_LABELS[location],
    `<table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("survivalGear.qty")}</th>
          <th>${t("common.weight")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`,
  );
}
