import { t } from "../../../localization/pt-BR/index.js";
import { setHTML } from "../../../shared/dom.js";
import {
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
} from "../../../shared/constants.js";
import {
  equippedMoveSelect,
  storageOptions,
} from "../shared/equipmentSelectors.js";
import {
  customFieldsBody,
  escapeHtml,
  cardTitleCell,
} from "../../../shared/renderUtils.js";
import {
  renderStorageLocationBlock,
  findInstance,
} from "../shared/inventoryRenderUtils.js";
import {
  equippedItemTabs,
  itemTabsDetailRow,
} from "../../../shared/itemTabs.js";
import { enchantmentsBody } from "../shared/enchantments/render.js";
import { getAccessoryItemCategory } from "../shared/enchantments/model.js";
import {
  sendToAllyRowHTML,
  hasLinkedAllies,
} from "../shared/sendToAllyControl.js";
import { getActiveCharacterId } from "../../../store/characters.js";

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
  return (
    countEquipped(accessoryId, selected) >= Number(record.accessory_equip_limit)
  );
}

function displayName(inst, record) {
  return inst.accessory_custom_name || record.accessory_name;
}

function resolvedAccessory(sheet, instanceId) {
  const inv = sheet?.inventory?.accessories;
  if (!inv) return null;

  return findInstance(
    [inv.equipped, inv.stash, inv.camp, inv.backpack],
    instanceId,
  );
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

  const instanceId = inst.id;
  const resolved = resolvedAccessory(sheet, instanceId);

  return `
    <div class="equipped-slot-grid" data-instance-id="${instanceId}">
      <div class="equipped-slot-label">${t("accessories.accessory")}</div>
      <div class="equipped-slot-controls">
        <strong class="equipped-accessory-name">${escapeHtml(displayName(inst, record))}</strong>
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
    ${equippedItemTabs(instanceId, [
      {
        key: "customize",
        label: t("common.customize"),
        content: customFieldsBody({
          instanceId,
          name: inst.accessory_custom_name,
          description: inst.accessory_custom_description,
          effect: inst.accessory_custom_effect,
        }),
      },
      {
        key: "enchantments",
        label: t("enchantments.title"),
        content: enchantmentsBody({
          instanceId,
          entries: inst.enchantments || [],
          itemCategory: getAccessoryItemCategory(),
          resolvedEntries: resolved?.enchantments,
        }),
      },
    ])}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED ACCESSORIES
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredAccessories(selected, data, sheet) {
  const stored = selected.accessories.filter((a) => !a.is_equipped);
  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderStorageSection(loc, stored, selected, data, sheet),
  ).join("");
  setHTML("accessoryStorageList", sections);
}

function renderStorageSection(location, stored, selected, data, sheet) {
  const accessories = stored.filter((a) => a.storedAt === location);
  const showSendToAlly = hasLinkedAllies(getActiveCharacterId());
  const colCount = showSendToAlly ? 5 : 4;

  let bodyRows;
  if (accessories.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="${colCount}">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = accessories
      .map((inst) => {
        const record = accessoryRecord(inst.accessory_id, data);
        if (!record) return "";

        const instanceId = inst.id;
        const atLimit = isAtLimit(inst.accessory_id, selected, data);
        const resolved = resolvedAccessory(sheet, instanceId);

        return `
        <tr data-instance-id="${instanceId}">
          ${cardTitleCell(escapeHtml(displayName(inst, record)))}
          <td class="col-num" data-label="${t("common.price")}">
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
          <td class="col-storage" data-label="${t("common.storage")}">
            <select class="accessory-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
            <button class="btn-remove remove-accessory" data-instance-id="${instanceId}">✕</button>
          </td>
          <td class="col-action">
            <button
              class="equip-stored-accessory"
              data-instance-id="${instanceId}"
              ${atLimit ? "disabled" : ""}
              title="${atLimit ? t("accessories.limitReached") : ""}"
            >${t("common.equip")}</button>
          </td>
          ${showSendToAlly ? `<td class="col-send-ally" data-label="${t("inventory.sendToAlly.header")}">${sendToAllyRowHTML(instanceId)}</td>` : ""}
        </tr>
        ${itemTabsDetailRow(colCount, instanceId, [
          {
            key: "customize",
            label: t("common.customize"),
            content: customFieldsBody({
              instanceId,
              name: inst.accessory_custom_name,
              description: inst.accessory_custom_description,
              effect: inst.accessory_custom_effect,
            }),
          },
          {
            key: "enchantments",
            label: t("enchantments.title"),
            content: enchantmentsBody({
              instanceId,
              entries: inst.enchantments || [],
              itemCategory: getAccessoryItemCategory(),
              resolvedEntries: resolved?.enchantments,
            }),
          },
        ])}
        `;
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
          <th>${t("common.price")}</th>
          <th>${t("common.storage")}</th>
          <th class="col-action"></th>
          ${showSendToAlly ? `<th class="col-send-ally">${t("inventory.sendToAlly.header")}</th>` : ""}
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`,
  );
}
