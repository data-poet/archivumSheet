import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LOCATIONS, STORAGE_LABELS } from "../../shared/constants.js";
import { detailRow } from "./renderUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function customItemLocationSelect(customItemId, currentLocation) {
  const options = STORAGE_LOCATIONS
    .map(
      (loc) =>
        `<option value="${loc}" ${loc === currentLocation ? "selected" : ""}>${t(`storage.${loc}`)}</option>`,
    )
    .join("");
  return `<select
    class="custom-item-location-select"
    data-custom-item-id="${customItemId}"
  >${options}</select>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────────────────────────────────────

export function renderCustomInventory(selected, data, sheet) {
  const entries = selected.customInventory ?? [];

  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderCustomInventorySection(loc, entries, sheet),
  ).join("");

  setHTML("customInventoryList", sections);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION
// ─────────────────────────────────────────────────────────────────────────────

function renderCustomInventorySection(location, entries, sheet) {
  const sectionEntries = entries.filter((e) => e.storedAt === location);

  let bodyRows = "";

  if (sectionEntries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="4">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = sectionEntries
      .map((entry) => {
        const resolvedBucket = sheet?.inventory?.customInventory?.[location];
        const resolvedEntry  = resolvedBucket?.find(
          (e) => e.custom_item_id === entry.custom_item_id,
        );
        const totalWeight = resolvedEntry?.total_weight ?? "—";

        const detailFields = buildDetailFields(entry);

        return `
          <tr>
            <td>${entry.name}</td>
            <td class="col-num">
              <div class="num-stepper">
                <input
                  type="text"
                  inputmode="numeric"
                  class="custom-item-qty"
                  data-custom-item-id="${entry.custom_item_id}"
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
              ${customItemLocationSelect(entry.custom_item_id, location)}
              <button
                class="btn-remove remove-custom-item"
                data-custom-item-id="${entry.custom_item_id}"
              >✕</button>
            </td>
          </tr>
          ${detailRow(4, detailFields)}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("customInventory.qty")}</th>
          <th>${t("common.weight")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL FIELDS
// ─────────────────────────────────────────────────────────────────────────────

function buildDetailFields(entry) {
  return [
    { label: t("common.price"),               value: entry.price != null ? String(entry.price) : "—" },
    { label: t("common.weight"),              value: entry.weight != null ? String(entry.weight) : "—" },
    { label: t("customInventory.description"), value: entry.description ?? "" },
  ];
}
