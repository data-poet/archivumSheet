import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import {
  materialOptions,
  equippedMoveSelect,
  storageOptions,
} from "../../shared/equipmentSelectors.js";
import {
  formatRichText,
  detailRow,
  equippedDetailBlock,
} from "./renderUtils.js";

function resolvedRanged(sheet, instanceId) {
  if (!sheet?.inventory?.ranged) return null;
  const inv = sheet.inventory.ranged;
  for (const bucket of [
    ...(inv.equipped || []),
    ...(inv.backpack || []),
    ...(inv.stash || []),
    ...(inv.camp || []),
  ]) {
    if (bucket && bucket._instanceId === instanceId) return bucket;
  }
  return null;
}

function rangedDetailFields(resolved, weaponData) {
  const src = resolved ?? weaponData;
  if (!src) return [];
  return [
    { label: t("common.type"), value: src.weapon_type ?? "—" },
    { label: t("common.skill"), value: src.weapon_skill ?? "—" },
    {
      label: t("ranged.gdpMod"),
      value:
        resolved?.weapon_final_gdp_modifier ?? src.weapon_gdp_modifier ?? "—",
    },
    {
      label: t("common.weight"),
      value: resolved?.weapon_final_weight ?? src.weapon_weight ?? "—",
    },
    {
      label: t("common.price"),
      value: resolved?.weapon_final_price ?? src.weapon_price ?? "—",
    },
    { label: t("ranged.minST"), value: src.weapon_min_strength ?? "—" },
    { label: t("ranged.damageType"), value: src.weapon_damage_type ?? "—" },
    { label: t("ranged.tr"), value: src.weapon_tr ?? "—" },
    { label: t("ranged.prec"), value: src.weapon_prec ?? "—" },
    {
      label: t("ranged.halfDist"),
      value:
        resolved?.weapon_half_distance ??
        weaponData?.weapon_half_distance ??
        "—",
    },
    {
      label: t("ranged.maxDist"),
      value:
        resolved?.weapon_max_distance ?? weaponData?.weapon_max_distance ?? "—",
    },
    { label: t("ranged.reload"), value: src.weapon_reload_speed ?? "—" },
    {
      label: t("common.description"),
      value: formatRichText(weaponData?.weapon_description),
      rich: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedRanged(selected, data, sheet) {
  const equippedWeapons = selected.ranged_weapons.filter((w) => w.is_equipped);
  const names = [...new Set(data.ranged_weapons.map((w) => w.weapon_name))];

  if (equippedWeapons.length === 0) {
    setHTML("rangedSlots", `<p class="empty-storage">${t("common.noEquipped")}</p>`);
    return;
  }

  setHTML(
    "rangedSlots",
    equippedWeapons
      .map((inst) => renderEquippedRangedSlot(inst, names, data, sheet))
      .join(""),
  );
}

function renderEquippedRangedSlot(inst, names, data, sheet) {
  const weaponData = data.ranged_weapons.find(
    (w) => w.weapon_id === inst.weapon_id,
  );
  if (!weaponData) return "";

  const tiers = data.ranged_weapons
    .filter((w) => w.weapon_name === weaponData.weapon_name)
    .map((w) => w.weapon_tier);

  const material = resolveMaterial(inst, data.materials);
  const resolved = resolvedRanged(sheet, inst._instanceId);
  const instanceId = inst._instanceId;

  return `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">${t("ranged.ranged")}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-ranged-name" data-instance-id="${instanceId}">
          ${names
            .map(
              (name) =>
                `<option value="${name}" ${weaponData.weapon_name === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-ranged-tier" data-instance-id="${instanceId}">
          ${tiers
            .map(
              (tier) =>
                `<option value="${tier}" ${weaponData.weapon_tier === tier ? "selected" : ""}>${tier}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-ranged-material" data-instance-id="${instanceId}">
          ${materialOptions(data.materials, inst.material_id)}
        </select>
        ${hpModifierBlock({
          baseHp: weaponData.weapon_hit_points ?? 0,
          material,
          hpModifier: inst.hit_points_modifier,
          cssClass: "equipped-ranged-hp",
          dataAttrs: `data-instance-id="${instanceId}"`,
        })}
        ${equippedMoveSelect("equipped-ranged-move", `data-instance-id="${instanceId}"`)}
      </div>
    </div>
    ${equippedDetailBlock(rangedDetailFields(resolved, weaponData))}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredRanged(selected, data, sheet) {
  const stored = selected.ranged_weapons.filter((w) => !w.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data, sheet))
    .join("");
  setHTML("rangedStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const weapons = stored.filter((w) => w.storedAt === location);

  let bodyRows = "";
  if (weapons.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = weapons
      .map((inst) => {
        const weaponData = data.ranged_weapons.find(
          (w) => w.weapon_id === inst.weapon_id,
        );
        if (!weaponData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedRanged(sheet, inst._instanceId);
        const instanceId = inst._instanceId;

        return `
        <tr>
          <td>${weaponData.weapon_name}</td>
          <td>${weaponData.weapon_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: weaponData.weapon_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-ranged-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="ranged-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-ranged" data-instance-id="${instanceId}">${t("common.equip")}</button>
            <button class="btn-remove remove-ranged" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${detailRow(6, rangedDetailFields(resolved, weaponData))}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <table>
      <thead>
        <tr>
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("ranged.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}
