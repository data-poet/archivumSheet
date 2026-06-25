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

function resolvedMelee(sheet, instanceId) {
  if (!sheet?.inventory?.melee) return null;
  const inv = sheet.inventory.melee;
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

function meleeDetailFields(resolved, weaponData) {
  const src = resolved ?? weaponData;
  if (!src) return [];
  const length = Number(weaponData?.weapon_length) || 0;
  const reach = length < 1 ? 1 : Math.floor((length + 1) / 2) + 1;
  return [
    { label: t("common.type"), value: src.weapon_type ?? "—" },
    { label: t("common.skill"), value: src.weapon_skill ?? "—" },
    {
      label: t("melee.balMod"),
      value:
        resolved?.weapon_final_bal_modifier ?? src.weapon_bal_modifier ?? "—",
    },
    {
      label: t("melee.gdpMod"),
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
    { label: t("melee.reach"), value: resolved?.weapon_reach ?? reach },
    { label: t("melee.minST"), value: src.weapon_min_strength ?? "—" },
    { label: t("melee.damageType"), value: src.weapon_damage_type ?? "—" },
    ...(resolved?.weapon_gdp_damage != null
      ? [{ label: t("melee.gdpDmg"), value: resolved.weapon_gdp_damage }]
      : []),
    ...(resolved?.weapon_bal_damage != null
      ? [{ label: t("melee.balDmg"), value: resolved.weapon_bal_damage }]
      : []),
    {
      label: t("common.description"),
      value: formatRichText(weaponData?.weapon_description),
      rich: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED MELEE
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedMelee(selected, data, sheet) {
  const equippedWeapons = selected.melee_weapons.filter((w) => w.is_equipped);
  const names = [...new Set(data.melee_weapons.map((w) => w.weapon_name))];

  if (equippedWeapons.length === 0) {
    setHTML("meleeSlots", `<p class="empty-storage">${t("common.noEquipped")}</p>`);
    return;
  }

  setHTML(
    "meleeSlots",
    equippedWeapons
      .map((inst) => renderEquippedMeleeSlot(inst, names, data, sheet))
      .join(""),
  );
}

function renderEquippedMeleeSlot(inst, names, data, sheet) {
  const weaponData = data.melee_weapons.find(
    (w) => w.weapon_id === inst.weapon_id,
  );
  if (!weaponData) return "";

  const tiers = data.melee_weapons
    .filter((w) => w.weapon_name === weaponData.weapon_name)
    .map((w) => w.weapon_tier);

  const material = resolveMaterial(inst, data.materials);
  const resolved = resolvedMelee(sheet, inst._instanceId);
  const instanceId = inst._instanceId;

  return `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">${t("melee.melee")}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-melee-name" data-instance-id="${instanceId}">
          ${names
            .map(
              (name) =>
                `<option value="${name}" ${weaponData.weapon_name === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-melee-tier" data-instance-id="${instanceId}">
          ${tiers
            .map(
              (tier) =>
                `<option value="${tier}" ${weaponData.weapon_tier === tier ? "selected" : ""}>${tier}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-melee-material" data-instance-id="${instanceId}">
          ${materialOptions(data.materials, inst.material_id)}
        </select>
        ${hpModifierBlock({
          baseHp: weaponData.weapon_hit_points ?? 0,
          material,
          hpModifier: inst.hit_points_modifier,
          cssClass: "equipped-melee-hp",
          dataAttrs: `data-instance-id="${instanceId}"`,
        })}
        ${equippedMoveSelect("equipped-melee-move", `data-instance-id="${instanceId}"`)}
        <button class="btn-remove remove-equipped-melee" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    ${equippedDetailBlock(meleeDetailFields(resolved, weaponData))}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED MELEE
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredMelee(selected, data, sheet) {
  const stored = selected.melee_weapons.filter((w) => !w.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data, sheet))
    .join("");
  setHTML("meleeStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const weapons = stored.filter((w) => w.storedAt === location);

  let bodyRows = "";
  if (weapons.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = weapons
      .map((inst) => {
        const weaponData = data.melee_weapons.find(
          (w) => w.weapon_id === inst.weapon_id,
        );
        if (!weaponData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedMelee(sheet, inst._instanceId);
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
              cssClass: "stored-melee-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="melee-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-melee" data-instance-id="${instanceId}">${t("common.equip")}</button>
            <button class="btn-remove remove-melee" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        ${detailRow(6, meleeDetailFields(resolved, weaponData))}`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("melee.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
