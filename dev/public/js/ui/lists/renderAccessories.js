import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import {
  STORAGE_LABELS,
  ACCESSORY_ITEM_CATEGORY,
} from "../../shared/constants.js";
import {
  equippedMoveSelect,
  storageOptions,
} from "../../shared/equipmentSelectors.js";
import {
  customFieldsEquippedDetail,
  customFieldsDetailRow,
} from "./renderUtils.js";
import {
  enchantmentsEquippedDetail,
  enchantmentsDetailRow,
} from "./renderEnchantments.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function accessoryRecord(accessoryId, data) {
  return data.accessories.find((a) => a.accessory_id === accessoryId) ?? null;
}

function countEquipped(accessoryId, selected) {
  return selected.accessories.filter(
    (a) => a.accessory_id === accessoryId && a.is_equipped,
  ).length;
}

function isAtLimit(accessoryId, selected, data) {
  const record = accessoryRecord(accessoryId, data);
  if (!record) return false;
  return countEquipped(accessoryId, selected) >= Number(record.accessory_equip_limit);
}

/** If the user has set a custom name, that's the display name; otherwise fall
 *  back to the accessory's catalog name. */
function displayName(inst, record) {
  return inst.accessory_custom_name || record.accessory_name;
}

// Look up a resolved accessory from the engine output by instanceId —
// mirrors resolvedArmor/resolvedMelee in their respective render files.
function resolvedAccessory(sheet, instanceId) {
  const inv = sheet?.inventory?.accessories;
  if (!inv) return null;

  for (const bucket of [inv.equipped, inv.stash, inv.camp, inv.backpack]) {
    const found = (bucket || []).find((a) => a._instanceId === instanceId);
    if (found) return found;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED ACCESSORIES
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedAccessories(selected, data, sheet) {
  const equipped = selected.accessories.filter((a) => a.is_equipped);

  if (equipped.length === 0) {
    setHTML(
      "accessorySlots",
      `<p class="empty-storage">${t("common.noEquipped")}</p>`,
    );
    return;
  }

  setHTML(
    "accessorySlots",
    equipped
      .map((inst) => renderEquippedAccessorySlot(inst, data, sheet))
      .join(""),
  );
}

function renderEquippedAccessorySlot(inst, data, sheet) {
  const record = accessoryRecord(inst.accessory_id, data);
  if (!record) return "";

  const instanceId = inst._instanceId;
  const resolved = resolvedAccessory(sheet, instanceId);

  return `
    <div class="equipped-slot-grid" data-instance-id="${instanceId}">
      <div class="equipped-slot-label">${t("accessories.accessory")}</div>
      <div class="equipped-slot-controls">
        <strong class="equipped-accessory-name">${displayName(inst, record)}</strong>
        <label class="hp-modifier">
          ${t("common.price")}:
          <input
            type="number"
            min="0"
            step="0.01"
            class="equipped-accessory-price"
            data-instance-id="${instanceId}"
            value="${inst.price ?? 0}"
            style="width:80px"
          />
        </label>
        ${equippedMoveSelect("equipped-accessory-move", `data-instance-id="${instanceId}"`)}
        <button class="btn-remove remove-equipped-accessory" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    ${customFieldsEquippedDetail({
      instanceId,
      name: inst.accessory_custom_name,
      description: inst.accessory_custom_description,
      effect: inst.accessory_custom_effect,
    })}
    ${enchantmentsEquippedDetail({
      instanceId,
      entries: inst.enchantments || [],
      itemCategory: ACCESSORY_ITEM_CATEGORY,
      resolvedEntries: resolved?.enchantments,
    })}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED ACCESSORIES
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredAccessories(selected, data, sheet) {
  const stored = selected.accessories.filter((a) => !a.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, selected, data, sheet))
    .join("");
  setHTML("accessoryStorageList", sections);
}

function renderStorageSection(location, stored, selected, data, sheet) {
  const accessories = stored.filter((a) => a.storedAt === location);

  let bodyRows;
  if (accessories.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="4">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = accessories
      .map((inst) => {
        const record = accessoryRecord(inst.accessory_id, data);
        if (!record) return "";

        const instanceId = inst._instanceId;
        const atLimit = isAtLimit(inst.accessory_id, selected, data);
        const resolved = resolvedAccessory(sheet, instanceId);

        return `
        <tr data-instance-id="${instanceId}">
          <td>${displayName(inst, record)}</td>
          <td class="col-num">
            <input
              type="number"
              min="0"
              step="0.01"
              class="stored-accessory-price"
              data-instance-id="${instanceId}"
              value="${inst.price ?? 0}"
              style="width:80px"
            />
          </td>
          <td>
            <select class="accessory-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button
              class="equip-stored-accessory"
              data-instance-id="${instanceId}"
              ${atLimit ? "disabled" : ""}
              title="${atLimit ? t("accessories.limitReached") : ""}"
            >${t("common.equip")}</button>
            <button class="btn-remove remove-accessory" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${customFieldsDetailRow(4, {
          instanceId,
          name: inst.accessory_custom_name,
          description: inst.accessory_custom_description,
          effect: inst.accessory_custom_effect,
        })}
        ${enchantmentsDetailRow(4, {
          instanceId,
          entries: inst.enchantments || [],
          itemCategory: ACCESSORY_ITEM_CATEGORY,
          resolvedEntries: resolved?.enchantments,
        })}
        `;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th>
          <th>${t("common.price")}</th>
          <th>${t("common.storage")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
