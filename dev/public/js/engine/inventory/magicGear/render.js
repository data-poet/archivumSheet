import {
  t,
  getMagicGearLimitReachedLabel,
} from "../../../localization/pt-BR/index.js";
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
  customFieldsEquippedDetail,
  customFieldsDetailRow,
} from "../../../shared/renderUtils.js";
import { enchantmentsExpander } from "../shared/enchantments/render.js";
import { getMagicGearItemCategory } from "../shared/enchantments/model.js";
import { isMagicGearAtEquipLimit } from "./model.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function magicGearRecord(magicGearId, data) {
  return data.magicGear.find((g) => g.magic_gear_id === magicGearId) ?? null;
}

function displayName(inst, record) {
  return inst.magic_gear_custom_name || record.magic_gear_name;
}

// Mirrors resolvedAccessory in renderAccessories.js.
function resolvedMagicGear(sheet, instanceId) {
  const inv = sheet?.inventory?.magicGear;
  if (!inv) return null;

  for (const bucket of [inv.equipped, inv.stash, inv.camp, inv.backpack]) {
    const found = (bucket || []).find((g) => g._instanceId === instanceId);
    if (found) return found;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED MAGIC GEAR
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedMagicGear(selected, data, sheet) {
  const equipped = selected.magicGear.filter((g) => g.is_equipped);

  if (equipped.length === 0) {
    setHTML(
      "magicGearSlots",
      `<p class="empty-storage">${t("common.noEquipped")}</p>`,
    );
    return;
  }

  setHTML(
    "magicGearSlots",
    equipped
      .map((inst) => renderEquippedMagicGearSlot(inst, data, sheet))
      .join(""),
  );
}

function renderEquippedMagicGearSlot(inst, data, sheet) {
  const record = magicGearRecord(inst.magic_gear_id, data);
  if (!record) return "";

  const instanceId = inst._instanceId;
  const resolved = resolvedMagicGear(sheet, instanceId);

  return `
    <div class="equipped-slot-grid" data-instance-id="${instanceId}">
      <div class="equipped-slot-label">${t("magicGear.magicGear")}</div>
      <div class="equipped-slot-controls">
        <strong class="equipped-magic-gear-name">${displayName(inst, record)}</strong>
        <span class="item-detail"><em>${t("common.price")}:</em> ${resolved?.total_value ?? record.magic_gear_price}</span>
        <span class="item-detail"><em>${t("common.weight")}:</em> ${resolved?.total_weight ?? record.magic_gear_weight}</span>
        ${equippedMoveSelect("equipped-magic-gear-move", `data-instance-id="${instanceId}"`)}
        <button class="btn-remove remove-equipped-magic-gear" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    ${customFieldsEquippedDetail(
      {
        instanceId,
        name: inst.magic_gear_custom_name,
        description: inst.magic_gear_custom_description,
        effect: inst.magic_gear_custom_effect,
      },
      enchantmentsExpander({
        instanceId,
        entries: inst.enchantments || [],
        itemCategory: getMagicGearItemCategory(),
        resolvedEntries: resolved?.enchantments,
      }),
    )}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED MAGIC GEAR
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredMagicGear(selected, data, sheet) {
  const stored = selected.magicGear.filter((g) => !g.is_equipped);
  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderStorageSection(loc, stored, data, sheet),
  ).join("");
  setHTML("magicGearStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const items = stored.filter((g) => g.storedAt === location);

  let bodyRows;
  if (items.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="4">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = items
      .map((inst) => {
        const record = magicGearRecord(inst.magic_gear_id, data);
        if (!record) return "";

        const instanceId = inst._instanceId;
        const resolved = resolvedMagicGear(sheet, instanceId);
        // Per-item, not per-section: each magic_gear_type has its own equip cap.
        const atLimit = isMagicGearAtEquipLimit(inst.magic_gear_id);
        const limitLabel = atLimit
          ? getMagicGearLimitReachedLabel(
              record.magic_gear_type,
              data.magicGearEquipLimits[record.magic_gear_type],
            )
          : "";

        return `
        <tr data-instance-id="${instanceId}">
          <td>${displayName(inst, record)}</td>
          <td class="col-num">${resolved?.total_value ?? record.magic_gear_price}</td>
          <td>
            <select class="magic-gear-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button
              class="equip-stored-magic-gear"
              data-instance-id="${instanceId}"
              ${atLimit ? "disabled" : ""}
              title="${limitLabel}"
            >${t("common.equip")}</button>
            <button class="btn-remove remove-magic-gear" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${customFieldsDetailRow(
          4,
          {
            instanceId,
            name: inst.magic_gear_custom_name,
            description: inst.magic_gear_custom_description,
            effect: inst.magic_gear_custom_effect,
          },
          enchantmentsExpander({
            instanceId,
            entries: inst.enchantments || [],
            itemCategory: getMagicGearItemCategory(),
            resolvedEntries: resolved?.enchantments,
          }),
        )}
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
