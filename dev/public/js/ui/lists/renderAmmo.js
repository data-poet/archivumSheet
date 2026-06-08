import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { detailRow, formatRichText } from "./renderUtils.js";
import { state } from "../../state.js";

const CONTAINER_STORAGE_LOCATIONS_CARRIABLE     = ["equipped", "backpack", "stash", "camp"];
const CONTAINER_STORAGE_LOCATIONS_NOT_CARRIABLE = ["stash", "camp"];
const LOOSE_STORAGE_LOCATIONS = ["backpack", "stash", "camp"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function resolvedContainer(sheet, instanceId) {
  if (!sheet?.inventory?.ammo?.containers) return null;
  for (const bucket of Object.values(sheet.inventory.ammo.containers)) {
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

function compatibleAmmoOptions(containerId, containerData, ammoData) {
  const container = getContainerRecord(containerId, containerData);
  if (!container) return "";
  const compatible = ammoData.filter((a) => a.ammo_type === container.container_ammo_type);
  if (compatible.length === 0) return `<option value="">—</option>`;
  return compatible
    .map((a) => `<option value="${a.ammo_id}">${a.ammo_name}</option>`)
    .join("");
}

// ─── Storage options for containers (respects is_carriable) ──────────────────

function containerStorageOptions(currentLocation, isCarriable) {
  // Coerce non-carriable containers that ended up in equipped/backpack → stash
  const locations = isCarriable
    ? CONTAINER_STORAGE_LOCATIONS_CARRIABLE
    : CONTAINER_STORAGE_LOCATIONS_NOT_CARRIABLE;

  const safeLocation = locations.includes(currentLocation)
    ? currentLocation
    : "stash";

  return locations
    .map(
      (loc) =>
        `<option value="${loc}" ${safeLocation === loc ? "selected" : ""}>
          ${t(`storage.${loc}`)}
        </option>`,
    )
    .join("");
}

// ─── Move select for ammo inside a container ─────────────────────────────────

function containerMoveOptions(fromInstanceId, allContainers, containerData) {
  const otherContainers = allContainers.filter(
    (c) => c._instanceId !== fromInstanceId,
  );
  if (otherContainers.length === 0) return null;

  const options = otherContainers
    .map((c) => {
      const rec  = getContainerRecord(c.container_id, containerData);
      const name = rec?.container_box_name ?? c.container_id;
      return `<option value="${c._instanceId}">${name}</option>`;
    })
    .join("");

  return `<select class="ammo-in-container-move-select" data-from-instance-id="${fromInstanceId}" data-ammo-id="__PLACEHOLDER__">
    <option value="">— ${t("common.storage")} —</option>
    ${options}
  </select>`;
}

// ─── Move select for loose ammo ───────────────────────────────────────────────

function looseAmmoLocationSelect(ammoId, currentLocation) {
  const options = LOOSE_STORAGE_LOCATIONS
    .map(
      (loc) =>
        `<option value="${loc}" ${loc === currentLocation ? "selected" : ""}>${t(`storage.${loc}`)}</option>`,
    )
    .join("");
  return `<select
    class="loose-ammo-location-select"
    data-ammo-id="${ammoId}"
    data-stored-at="${currentLocation}"
  >${options}</select>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER CONTAINERS
// ─────────────────────────────────────────────────────────────────────────────

export function renderAmmoContainers(selected, data, sheet) {
  const containers    = selected.ammo_containers;
  const ammoData      = data.ammo ?? [];
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
      .map((inst) => renderContainerSlot(inst, ammoData, containerData, sheet, containers))
      .join(""),
  );
}

function renderContainerSlot(inst, ammoData, containerData, sheet, allContainers) {
  const containerRecord = getContainerRecord(inst.container_id, containerData);
  const resolved        = resolvedContainer(sheet, inst._instanceId);
  const instanceId      = inst._instanceId;

  const displayName = containerRecord?.container_box_name ?? inst.container_id;
  const capacity    = containerRecord?.container_capacity ? parseInt(containerRecord.container_capacity, 10) : "?";
  const ammoType    = containerRecord?.container_ammo_type ?? "?";
  const isCarriable = containerRecord?.is_carriable === "TRUE";

  const usedCap =
    resolved?.used_capacity ??
    inst.contents.reduce((s, e) => s + e.quantity, 0);
  const remainingCap =
    resolved?.remaining_capacity ?? (typeof capacity === "number" ? capacity - usedCap : 0);
  const totalWeight = resolved?.total_weight ?? "—";

  // Contents rows
  const contentsRows =
    inst.contents.length === 0
      ? `<tr class="empty-row"><td colspan="3">${t("common.empty")}</td></tr>`
      : inst.contents.map((entry) => {
          const lineWeight =
            resolved?.contents?.find((c) => c.ammo_id === entry.ammo_id)?.line_weight ?? "—";
          const ammoRecord  = getAmmoRecord(entry.ammo_id, ammoData);
          const maxForEntry = (typeof capacity === "number")
            ? capacity - inst.contents.filter((e) => e.ammo_id !== entry.ammo_id).reduce((s, e) => s + e.quantity, 0)
            : undefined;

          // Build move-to-container select for this ammo entry
          const moveSelectHtml = (() => {
            const other = allContainers.filter((c) => c._instanceId !== instanceId);
            if (other.length === 0) return "";
            const opts = other
              .map((c) => {
                const rec  = getContainerRecord(c.container_id, containerData);
                const name = rec?.container_box_name ?? c.container_id;
                return `<option value="${c._instanceId}">${name}</option>`;
              })
              .join("");
            return `<select
                class="ammo-in-container-move-select"
                data-from-instance-id="${instanceId}"
                data-ammo-id="${entry.ammo_id}"
              >
                <option value="">↪ ${t("common.storage")}</option>
                ${opts}
              </select>`;
          })();

          return `
            <tr>
              <td>${getAmmoName(entry.ammo_id, ammoData)}</td>
              <td class="col-num">
                <div class="num-stepper">
                  <input
                    type="text"
                    inputmode="numeric"
                    class="ammo-qty-in-container"
                    data-instance-id="${instanceId}"
                    data-ammo-id="${entry.ammo_id}"
                    value="${entry.quantity}"
                    style="width:50px"
                  />
                  <div class="stepper-btns">
                    <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                    <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
                  </div>
                </div>
              </td>
              <td class="col-action">
                ${moveSelectHtml}
                <button
                  class="btn-remove remove-ammo-from-container"
                  data-instance-id="${instanceId}"
                  data-ammo-id="${entry.ammo_id}"
                >✕</button>
              </td>
            </tr>
            ${detailRow(3, ammoDetailFields(ammoRecord))}`;
        }).join("");

  const compatOptions = compatibleAmmoOptions(inst.container_id, containerData, ammoData);

  return `
    <div class="equipped-slot-grid ammo-container-slot">
      <div class="equipped-slot-label">${displayName}</div>
      <div class="equipped-slot-controls">
        <span class="ammo-type-badge">${ammoType}</span>
        <select class="ammo-container-storage-select" data-instance-id="${instanceId}">
          ${containerStorageOptions(inst.storedAt, isCarriable)}
        </select>
        <button class="btn-remove remove-ammo-container" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    <div class="ammo-container-body">
      <div class="ammo-container-meta">
        <span>${t("ammo.capacity")}: ${usedCap}/${capacity}</span>
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
        remainingCap > 0
          ? `<div class="ammo-add-to-container controls-row">
              <select class="ammo-select-for-container" data-instance-id="${instanceId}">
                ${compatOptions}
              </select>
              <input
                type="number"
                min="1"
                max="${remainingCap}"
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
  const ammoData  = data.ammo ?? [];

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
        const ammoRecord   = getAmmoRecord(entry.ammo_id, ammoData);
        const ammoName     = ammoRecord?.ammo_name ?? entry.ammo_id;
        const ammoType     = ammoRecord?.ammo_type ?? "—";
        const resolvedLoose = sheet?.inventory?.ammo?.loose?.[location];
        const resolvedEntry = resolvedLoose?.find((e) => e.ammo_id === entry.ammo_id);
        const totalWeight   = resolvedEntry?.total_weight ?? "—";

        return `
          <tr>
            <td>${ammoName}</td>
            <td class="col-num">${ammoType}</td>
            <td class="col-num">
              <div class="num-stepper">
                <input
                  type="text"
                  inputmode="numeric"
                  class="loose-ammo-qty"
                  data-ammo-id="${entry.ammo_id}"
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
              ${looseAmmoLocationSelect(entry.ammo_id, location)}
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
