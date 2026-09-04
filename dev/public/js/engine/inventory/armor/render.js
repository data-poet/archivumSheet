import { t } from "../../../localization/pt-BR/index.js";
import { setHTML } from "../../../shared/dom.js";
import {
  ARMOR_SLOTS,
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
} from "../../../shared/constants.js";
import { resolveMaterial } from "../shared/durabilityUtils.js";
import { hpModifierBlock } from "../shared/inventoryRenderUtils.js";
import { decimalToPercent } from "../../../components/resistances.js";
import {
  materialOptions,
  tierOptions,
  equippedMoveSelect,
  storageOptions,
} from "../shared/equipmentSelectors.js";
import {
  formatRichText,
  detailRow,
  equippedDetailBlock,
  customFieldsEquippedDetail,
  customFieldsDetailRow,
  withEnchantmentBadge,
} from "../../../shared/renderUtils.js";
import { enchantmentsExpander } from "../shared/enchantments/render.js";

// Look up a resolved armor piece from the engine output by instanceId
function resolvedArmor(sheet, instanceId) {
  if (!sheet?.inventory?.armor) return null;
  const inv = sheet.inventory.armor;
  for (const bucket of [
    inv.equipped,
    ...Object.values(inv.backpack || {}),
    ...Object.values(inv.stash || {}),
    ...Object.values(inv.camp || {}),
  ]) {
    const items = Array.isArray(bucket) ? bucket : bucket ? [bucket] : [];
    const found = items.find((p) => p && p._instanceId === instanceId);
    if (found) return found;
  }
  // Also check equipped slots (object keyed by slot name, value = resolved piece or null)
  if (inv.equipped) {
    const piece = Object.values(inv.equipped).find(
      (p) => p && p._instanceId === instanceId,
    );
    if (piece) return piece;
  }
  return null;
}

/**
 * Appends a small inline badge to a final value when it includes a
 * nonzero enchantment contribution — e.g. "1.74" + a "+10%" badge for
 * weight, "5" + a "+2" badge for damage resistance. Now shared via
 * shared/renderUtils.js (imported above) — see that doc comment for the
 * full rationale. This armor-local wrapper just pre-fills the title with
 * armor's own localized string, since armor's call sites below pass
 * suffix as a positional 3rd arg rather than the shared function's
 * options object.
 */
function withArmorEnchantmentBadge(finalValue, delta, suffix = "") {
  return withEnchantmentBadge(finalValue, delta, {
    suffix,
    title: t("armor.enchantmentContribution"),
  });
}

function armorDetailFields(resolved, armorData) {
  const src = resolved ?? armorData;
  if (!src) return [];
  return [
    { label: t("common.type"), value: src.armor_type ?? "—" },
    {
      label: t("armor.dr"),
      value: resolved
        ? withArmorEnchantmentBadge(
            resolved.final_damage_resistance,
            resolved.enchantment_damage_resistance_modifier,
          )
        : (src.armor_damage_resistance ?? "—"),
    },
    {
      label: t("common.weight"),
      value: resolved
        ? withArmorEnchantmentBadge(
            resolved.final_weight,
            decimalToPercent(resolved.enchantment_weight_modifier),
            "%",
          )
        : (src.armor_weight ?? "—"),
    },
    {
      label: t("common.price"),
      value: resolved
        ? withArmorEnchantmentBadge(
            resolved.total_value,
            resolved.enchantments_total_price,
          )
        : (src.armor_price ?? "—"),
    },
    {
      label: t("armor.hp"),
      value: resolved?.final_hit_points ?? src.armor_hit_points ?? "—",
    },
    ...(resolved?.material_def_effect
      ? [
          {
            label: t("common.materialEffect"),
            value: formatRichText(resolved.material_def_effect),
            rich: true,
          },
        ]
      : []),
    {
      label: t("common.description"),
      value: formatRichText(armorData?.armor_description),
      rich: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED ARMOR SLOTS
// ─────────────────────────────────────────────────────────────────────────────

export function renderArmorSlots(selected, data, sheet) {
  const html = ARMOR_SLOTS.map((slot) =>
    renderArmorSlot(slot, selected, data, sheet),
  ).join("");
  setHTML("armorSlots", html);
}

function renderArmorSlot(slot, selected, data, sheet) {
  const slotArmors = data.armors.filter((a) => a.armor_piece_location === slot);

  const equippedInstance = selected.armors.find((inst) => {
    if (!inst.is_equipped) return false;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location === slot;
  });

  const equippedArmorData = equippedInstance
    ? data.armors.find((a) => a.armor_id === equippedInstance.armor_id)
    : null;

  const names = [...new Set(slotArmors.map((a) => a.armor_name))];
  const tiers = equippedArmorData
    ? slotArmors
        .filter((a) => a.armor_name === equippedArmorData.armor_name)
        .map((a) => a.armor_tier)
    : [];

  const material = resolveMaterial(equippedInstance, data.materials);
  const resolved = equippedInstance
    ? resolvedArmor(sheet, equippedInstance._instanceId)
    : null;
  const fields = equippedInstance
    ? armorDetailFields(resolved, equippedArmorData)
    : [];

  return `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">${slot}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-armor-name" data-slot="${slot}">
          <option value="">${t("common.empty")}</option>
          ${names
            .map(
              (name) =>
                `<option value="${name}" ${equippedArmorData?.armor_name === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-armor-tier" data-slot="${slot}">
          ${tierOptions(tiers, equippedArmorData?.armor_tier)}
        </select>
        <select class="equipped-armor-material" data-slot="${slot}">
          ${materialOptions(data.materials, equippedInstance?.material_id)}
        </select>
        ${
          equippedInstance
            ? hpModifierBlock({
                baseHp: equippedArmorData?.armor_hit_points ?? 0,
                material,
                hpModifier: equippedInstance.hit_points_modifier,
                cssClass: "equipped-armor-hp",
                dataAttrs: `data-slot="${slot}"`,
              })
            : ""
        }
        ${equippedMoveSelect("equipped-armor-move", `data-slot="${slot}"`)}
        ${equippedInstance ? `<button class="btn-remove remove-equipped-armor" data-instance-id="${equippedInstance._instanceId}">✕</button>` : ""}
      </div>
    </div>
    ${equippedDetailBlock(fields)}
    ${
      equippedInstance
        ? customFieldsEquippedDetail(
            {
              instanceId: equippedInstance._instanceId,
              name: equippedInstance.armor_custom_name,
              description: equippedInstance.armor_custom_description,
              effect: equippedInstance.armor_custom_effect,
            },
            enchantmentsExpander({
              instanceId: equippedInstance._instanceId,
              entries: equippedInstance.enchantments || [],
              itemCategory: slot,
              resolvedEntries: resolved?.enchantments,
            }),
          )
        : ""
    }
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED ARMORS
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredArmors(selected, data, sheet) {
  const stored = selected.armors.filter((a) => !a.is_equipped);
  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderStorageSection(loc, stored, data, sheet),
  ).join("");
  setHTML("armorStorageList", sections);
}

function renderStorageSection(location, storedArmors, data, sheet) {
  const armorsInLocation = storedArmors.filter((a) => a.storedAt === location);

  let bodyRows = "";
  if (armorsInLocation.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="7">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = armorsInLocation
      .map((inst) => {
        const armorData = data.armors.find((a) => a.armor_id === inst.armor_id);
        if (!armorData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedArmor(sheet, inst._instanceId);
        const instanceId = inst._instanceId;

        return `
        <tr>
          <td>${armorData.armor_piece_location}</td>
          <td>${armorData.armor_name}</td>
          <td>${armorData.armor_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: armorData.armor_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-armor-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="armor-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-armor" data-instance-id="${instanceId}">${t("common.equip")}</button>
            <button class="btn-remove remove-armor" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${detailRow(7, armorDetailFields(resolved, armorData))}
        ${customFieldsDetailRow(
          7,
          {
            instanceId,
            name: inst.armor_custom_name,
            description: inst.armor_custom_description,
            effect: inst.armor_custom_effect,
          },
          enchantmentsExpander({
            instanceId,
            entries: inst.enchantments || [],
            itemCategory: armorData.armor_piece_location,
            resolvedEntries: resolved?.enchantments,
          }),
        )}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("armor.slot")}</th><th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("common.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
