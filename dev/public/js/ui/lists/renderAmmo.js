import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { storageOptions } from "../../shared/equipmentSelectors.js";
import { detailRow, equippedDetailBlock, formatRichText } from "./renderUtils.js";
import { state } from "../../state.js";

const CONTAINER_STORAGE_LOCATIONS = ["equipped", "backpack", "stash", "camp"];
const LOOSE_STORAGE_LOCATIONS = ["backpack", "stash", "camp"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function resolvedContainer(sheet, instanceId) {
  if (!sheet?.inventory?.ammo?.containers) return null;
  const containers = sheet.inventory.ammo.containers;
  for (const bucket of Object.values(containers)) {
    const found = bucket.find((c) => c._instanceId === instanceId);
    if (found) return found;
  }
  return null;
}

function getAmmoName(ammoId, ammoData) {
  return ammoData.find((a) => a.ammo_id === ammoId)?.ammo_name ?? ammoId;
}

function getAmmoRecord(ammoId, ammoData) {
  return ammoData.find((a) => a.ammo_id === ammoId) ?? null;
}

function getContainerRecord(containerId, containerData) {
  return containerData.find((c) => c.container_id === containerId) ?? null;
}

/** Build the standard detail fields array for a single ammo record. */
function ammoDetailFields(ammoRecord) {
  if (!ammoRecord) return [];
  return [
    { label: t("ammo.category"),    value: ammoRecord.ammo_category    ?? "—" },
    { label: t("ammo.price"),       value: ammoRecord.ammo_price != null ? String(ammoRecord.ammo_price) : "—" },
    { label: t("ammo.weight"),      value: ammoRecord.ammo_weight != null ? String(ammoRecord.ammo_weight) : "—" },
    { label: t("ammo.effect"),      value: ammoRecord.ammo_effect       ?? "—" },
    { label: t("ammo.description"), value: formatRichText(ammoRecord.ammo_description), rich: true },
  ];
}

// Options for ammo that is compatible with a given container (by ammo_type)
function compatibleAmmoOptions(containerId, containerData, ammoData) {
  const container = getContainerRecord(containerId, containerData);
  if (!container) return "";
  const compatible = ammoData.filter(
    (a) => a.ammo_type === container.container_ammo_type,
  );
  if (compatible.length === 0) return `<option value="">—</option>`;
  return compatible
    .map((a) => `<option value="${a.ammo_id}">${a.ammo_name}</option>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER STORAGE SELECT (equipped + backpack + stash + camp)
// ─────────────────────────────────────────────────────────────────────────────

function containerStorageOptions(currentLocation) {
  return CONTAINER_STORAGE_LOCATIONS.map(
    (loc) =>
      `<option value="${loc}" ${currentLocation === loc ? "selected" : ""}>
        ${t(`storage.${loc}`)}
      </option>`,
  ).join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER CONTAINERS
// ─────────────────────────────────────────────────────────────────────────────

export function renderAmmoContainers(selected, data, sheet) {
  const containers = selected.ammo_containers;
  const ammoData = data.ammo ?? [];
  const containerData = data.ammo_containers ?? [];

  if (containers.length === 0) {
    setHTML(
      "ammoContainerList",
      `<p class="empty-storage">${t("ammo.noContainers")}</p>`,
    );
    return;
  }

  setHTML(
    "ammoContainerList",
    containers
      .map((inst) =>
        renderContainerSlot(inst, ammoData, containerData, sheet),
      )
      .join(""),
  );
}

function renderContainerSlot(inst, ammoData, containerData, sheet) {
  const containerRecord = getContainerRecord(inst.container_id, containerData);
  const resolved = resolvedContainer(sheet, inst._instanceId);
  const instanceId = inst._instanceId;

  const displayName = containerRecord?.container_box_name ?? inst.container_id;
  const capacity = containerRecord?.container_capacity ?? "?";
  const ammoType = containerRecord?.container_ammo_type ?? "?";
  const isCarriable = containerRecord?.is_carriable ?? false;

  const usedCapacity =
    resolved?.used_capacity ??
    inst.contents.reduce((s, e) => s + e.quantity, 0);
  const remainingCapacity =
    resolved?.remaining_capacity ?? capacity - usedCapacity;
  const totalWeight = resolved?.total_weight ?? "—";

  // Contents rows — each ammo entry gets a detail row beneath it
  const contentsRows =
    inst.contents.length === 0
      ? `<tr class="empty-row"><td colspan="3">${t("common.empty")}</td></tr>`
      : inst.contents.map((entry) => {
          const lineWeight =
            resolved?.contents.find((c) => c.ammo_id === entry.ammo_id)
              ?.line_weight ?? "—";
          const ammoRecord = getAmmoRecord(entry.ammo_id, ammoData);
          return `
            <tr>
              <td>${getAmmoName(entry.ammo_id, ammoData)}</td>
              <td class="col-num">
                <input
                  type="number"
                  min="1"
                  class="ammo-qty-in-container"
                  data-instance-id="${instanceId}"
                  data-ammo-id="${entry.ammo_id}"
                  value="${entry.quantity}"
                  style="width:60px"
                />
              </td>
              <td class="col-action">
                <button
                  class="btn-remove remove-ammo-from-container"
                  data-instance-id="${instanceId}"
                  data-ammo-id="${entry.ammo_id}"
                >✕</button>
              </td>
            </tr>
            ${detailRow(3, ammoDetailFields(ammoRecord))}`;
        }).join("");

  // Add-ammo-to-container form
  const compatOptions = compatibleAmmoOptions(
    inst.container_id,
    containerData,
    ammoData,
  );

  return `
    <div class="equipped-slot-grid ammo-container-slot">
      <div class="equipped-slot-label">${displayName}</div>
      <div class="equipped-slot-controls">
        <span class="ammo-type-badge">${ammoType}</span>
        <select class="ammo-container-storage-select" data-instance-id="${instanceId}">
          ${containerStorageOptions(inst.storedAt)}
        </select>
        <button class="btn-remove remove-ammo-container" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    <div class="ammo-container-body">
      <div class="ammo-container-meta">
        <span>${t("ammo.capacity")}: ${usedCapacity}/${capacity}</span>
        <span>${t("common.weight")}: ${totalWeight} kg</span>
        ${!isCarriable ? `<span class="ammo-not-carriable">${t("ammo.notCarriable")}</span>` : ""}
      </div>
      <div class="table-wrapper"><table class="ammo-contents-table">
        <thead>
          <tr>
            <th>${t("common.name")}</th>
            <th>${t("ammo.qty")}</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>${contentsRows}</tbody>
      </table></div>
      ${
        remainingCapacity > 0
          ? `<div class="ammo-add-to-container controls-row">
              <select class="ammo-select-for-container" data-instance-id="${instanceId}">
                ${compatOptions}
              </select>
              <input
                type="number"
                min="1"
                max="${remainingCapacity}"
                value="1"
                class="ammo-qty-add-input"
                data-instance-id="${instanceId}"
                style="width:60px"
              />
              <button class="add-ammo-to-container-btn" data-instance-id="${instanceId}">${t("ammo.addAmmo")}</button>
            </div>`
          : `<p class="ammo-full">${t("ammo.containerFull")}</p>`
      }
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER LOOSE AMMO
// ─────────────────────────────────────────────────────────────────────────────

export function renderLooseAmmo(selected, data, sheet) {
  const looseAmmo = selected.loose_ammo ?? [];
  const ammoData = data.ammo ?? [];

  const sections = LOOSE_STORAGE_LOCATIONS.map((loc) =>
    renderLooseSection(loc, looseAmmo, ammoData, sheet),
  ).join("");

  setHTML("looseAmmoList", sections);
}

function renderLooseSection(location, looseAmmo, ammoData, sheet) {
  const entries = looseAmmo.filter((a) => a.storedAt === location);

  let bodyRows = "";
  if (entries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="5">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = entries
      .map((entry) => {
        const ammoRecord = getAmmoRecord(entry.ammo_id, ammoData);
        const ammoName = ammoRecord?.ammo_name ?? entry.ammo_id;
        const ammoType = ammoRecord?.ammo_type ?? "—";
        const resolvedLoose = sheet?.inventory?.ammo?.loose?.[location];
        const resolvedEntry = resolvedLoose?.find(
          (e) => e.ammo_id === entry.ammo_id,
        );
        const totalWeight = resolvedEntry?.total_weight ?? "—";

        return `
          <tr>
            <td>${ammoName}</td>
            <td class="col-num">${ammoType}</td>
            <td class="col-num">
              <input
                type="number"
                min="1"
                class="loose-ammo-qty"
                data-ammo-id="${entry.ammo_id}"
                data-stored-at="${location}"
                value="${entry.quantity}"
                style="width:60px"
              />
            </td>
            <td class="col-num">${totalWeight}</td>
            <td class="col-action">
              <button
                class="btn-remove remove-loose-ammo"
                data-ammo-id="${entry.ammo_id}"
                data-stored-at="${location}"
              >✕</button>
            </td>
          </tr>
          ${detailRow(5, ammoDetailFields(ammoRecord))}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("common.type")}</th>
          <th>${t("ammo.qty")}</th>
          <th>${t("common.weight")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}

