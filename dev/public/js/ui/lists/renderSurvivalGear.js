import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LOCATIONS, STORAGE_LABELS } from "../../shared/constants.js";
import { detailRow, formatRichText } from "./renderUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getGearRecord(gearId, survivalGearData) {
  return survivalGearData.find((g) => g.adventure_gear_id === gearId) ?? null;
}

function gearDetailFields(record) {
  if (!record) return [];
  return [
    { label: t("common.type"),    value: record.adventure_gear_type  ?? "—" },
    { label: t("common.price"),   value: record.adventure_gear_price != null ? String(record.adventure_gear_price) : "—" },
    { label: t("common.weight"),  value: record.adventure_gear_weight != null ? String(record.adventure_gear_weight) : "—" },
    { label: t("survivalGear.observation"), value: formatRichText(record.adventure_gear_observation), rich: true },
  ];
}

function survivalGearLocationSelect(gearId, currentLocation) {
  const options = STORAGE_LOCATIONS
    .map(
      (loc) =>
        `<option value="${loc}" ${loc === currentLocation ? "selected" : ""}>${t(`storage.${loc}`)}</option>`,
    )
    .join("");
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
  const entries          = selected.survivalGear   ?? [];
  const survivalGearData = data.survivalGear        ?? [];

  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderSurvivalGearSection(loc, entries, survivalGearData, sheet),
  ).join("");

  setHTML("survivalGearList", sections);
}

function renderSurvivalGearSection(location, entries, survivalGearData, sheet) {
  const sectionEntries = entries.filter((e) => e.storedAt === location);

  let bodyRows = "";

  if (sectionEntries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="4">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = sectionEntries
      .map((entry) => {
        const record         = getGearRecord(entry.adventure_gear_id, survivalGearData);
        const name           = record?.adventure_gear_name ?? entry.adventure_gear_id;
        const resolvedBucket = sheet?.inventory?.survivalGear?.[location];
        const resolvedEntry  = resolvedBucket?.find(
          (e) => e.adventure_gear_id === entry.adventure_gear_id,
        );
        const totalWeight = resolvedEntry?.total_weight ?? "—";

        return `
          <tr>
            <td>${name}</td>
            <td class="col-num">
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
            <td class="col-num">${totalWeight}</td>
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

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("survivalGear.qty")}</th>
          <th>${t("common.weight")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
