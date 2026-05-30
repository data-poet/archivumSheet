import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import {
  materialOptions,
  tierOptions,
  equippedMoveSelect,
  storageOptions,
} from "../../shared/equipmentSelectors.js";
import {
  formatRichText,
  detailRow,
  equippedDetailBlock,
} from "./renderUtils.js";

function resolvedShield(sheet, instanceId) {
  if (!sheet?.inventory?.shield) return null;
  const inv = sheet.inventory.shield;
  // equipped is a single object, storage buckets are arrays
  for (const bucket of [
    inv.equipped,
    ...(inv.backpack || []),
    ...(inv.stash || []),
    ...(inv.camp || []),
  ]) {
    if (bucket && bucket._instanceId === instanceId) return bucket;
  }
  return null;
}

function shieldDetailFields(resolved, shieldData) {
  const src = resolved ?? shieldData;
  if (!src) return [];
  return [
    { label: t("common.type"), value: src.shield_type ?? "—" },
    { label: t("shield.gdpMod"), value: shieldData?.shield_gdp_modifier ?? "—" },
    {
      label: t("shield.dr"),
      value:
        resolved?.shield_final_damage_resistence ??
        src.shield_damage_resistence ??
        src.shield_damage_resistance ??
        "—",
    },
    {
      label: t("common.weight"),
      value: resolved?.shield_final_weight ?? src.shield_weight ?? "—",
    },
    {
      label: t("common.price"),
      value: resolved?.shield_final_price ?? src.shield_price ?? "—",
    },
    {
      label: t("common.description"),
      value: formatRichText(shieldData?.shield_description),
      rich: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED SHIELD
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedShield(selected, data, sheet) {
  const equippedInstance = selected.shields.find((s) => s.is_equipped);
  const equippedShield = equippedInstance
    ? data.shields.find((s) => s.shield_id === equippedInstance.shield_id)
    : null;

  const names = [...new Set(data.shields.map((s) => s.shield_name))];
  const tiers = equippedShield
    ? data.shields
        .filter((s) => s.shield_name === equippedShield.shield_name)
        .map((s) => s.shield_tier)
    : [];

  const material = resolveMaterial(equippedInstance, data.materials);
  const resolved = equippedInstance
    ? resolvedShield(sheet, equippedInstance._instanceId)
    : null;
  const fields = equippedInstance
    ? shieldDetailFields(resolved, equippedShield)
    : [];

  setHTML(
    "shieldSlot",
    `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">${t("shield.shield")}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-shield-name">
          <option value="">${t("common.empty")}</option>
          ${names
            .map(
              (name) =>
                `<option value="${name}" ${equippedShield?.shield_name === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-shield-tier">
          ${tierOptions(tiers, equippedShield?.shield_tier)}
        </select>
        <select class="equipped-shield-material">
          ${materialOptions(data.materials, equippedInstance?.material_id)}
        </select>
        ${
          equippedInstance
            ? hpModifierBlock({
                baseHp: equippedShield?.shield_hit_points ?? 0,
                material,
                hpModifier: equippedInstance.hit_points_modifier,
                cssClass: "equipped-shield-hp",
              })
            : ""
        }
        ${equippedMoveSelect("equipped-shield-move")}
      </div>
    </div>
    ${equippedDetailBlock(fields)}
  `,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED SHIELDS
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredShields(selected, data, sheet) {
  const stored = selected.shields.filter((s) => !s.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data, sheet))
    .join("");
  setHTML("shieldStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const shields = stored.filter((s) => s.storedAt === location);

  let bodyRows = "";
  if (shields.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = shields
      .map((inst) => {
        const shieldData = data.shields.find(
          (s) => s.shield_id === inst.shield_id,
        );
        if (!shieldData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedShield(sheet, inst._instanceId);
        const instanceId = inst._instanceId;

        return `
        <tr>
          <td>${shieldData.shield_name}</td>
          <td>${shieldData.shield_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: shieldData.shield_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-shield-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="shield-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-shield" data-instance-id="${instanceId}">${t("common.equip")}</button>
            <button class="btn-remove remove-shield" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${detailRow(6, shieldDetailFields(resolved, shieldData))}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <table>
      <thead>
        <tr>
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("shield.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}
