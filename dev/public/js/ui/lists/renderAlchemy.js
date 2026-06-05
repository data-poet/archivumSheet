import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LOCATIONS, STORAGE_LABELS } from "../../shared/constants.js";
import { detailRow, formatRichText } from "./renderUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getConsumableRecord(consumableId, alchemyData) {
  return alchemyData.find((c) => c.consumable_id === consumableId) ?? null;
}

function consumableDetailFields(record) {
  if (!record) return [];
  return [
    { label: t("alchemy.type"),        value: record.consumable_type        ?? "—" },
    { label: t("alchemy.category"),    value: record.consumable_category    ?? "—" },
    { label: t("alchemy.duration"),    value: record.consumable_duration    ?? "—" },
    { label: t("alchemy.effect"),      value: record.consumable_effect      ?? "—" },
    { label: t("alchemy.toxicity"),    value: record.consumable_toxicity != null ? String(record.consumable_toxicity) : "—" },
    { label: t("alchemy.method"),      value: record.consumable_method      ?? "—" },
    { label: t("alchemy.effectArea"),  value: record.consumable_effect_area ?? "—" },
    { label: t("common.price"),        value: record.consumable_price != null ? String(record.consumable_price) : "—" },
    { label: t("common.weight"),       value: record.consumable_weight != null ? String(record.consumable_weight) : "—" },
    { label: t("alchemy.description"), value: formatRichText(record.consumable_description), rich: true },
    { label: t("alchemy.observation"), value: formatRichText(record.consumable_observation), rich: true },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────────────────────────────────────

export function renderAlchemy(selected, data, sheet) {
  const entries     = selected.alchemy ?? [];
  const alchemyData = data.alchemy     ?? [];

  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderAlchemySection(loc, entries, alchemyData, sheet),
  ).join("");

  setHTML("alchemyList", sections);
}

function renderAlchemySection(location, entries, alchemyData, sheet) {
  const sectionEntries = entries.filter((e) => e.storedAt === location);

  let bodyRows = "";

  if (sectionEntries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = sectionEntries
      .map((entry) => {
        const record      = getConsumableRecord(entry.consumable_id, alchemyData);
        const name        = record?.consumable_name ?? entry.consumable_id;
        const tier        = record?.consumable_tier ?? "—";
        const resolvedBucket = sheet?.inventory?.alchemy?.[location];
        const resolvedEntry  = resolvedBucket?.find(
          (e) => e.consumable_id === entry.consumable_id,
        );
        const totalWeight = resolvedEntry?.total_weight ?? "—";

        return `
          <tr>
            <td>${name}</td>
            <td class="col-num">${tier}</td>
            <td class="col-num">
              <input
                type="number"
                min="1"
                class="alchemy-qty"
                data-consumable-id="${entry.consumable_id}"
                data-stored-at="${location}"
                value="${entry.quantity}"
                style="width:60px"
              />
            </td>
            <td class="col-num">${totalWeight}</td>
            <td class="col-action">
              <button
                class="btn-remove remove-alchemy"
                data-consumable-id="${entry.consumable_id}"
                data-stored-at="${location}"
              >✕</button>
            </td>
          </tr>
          ${detailRow(5, consumableDetailFields(record))}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("alchemy.tier")}</th>
          <th>${t("alchemy.qty")}</th>
          <th>${t("common.weight")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
