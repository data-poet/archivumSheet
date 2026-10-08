import { t } from "../../../localization/pt-BR/index.js";
import { setHTML } from "../../../shared/dom.js";
import {
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
} from "../../../shared/constants.js";
import { resolveMaterial } from "../shared/durabilityUtils.js";
import {
  hpModifierBlock,
  renderStorageLocationBlock,
  findInstance,
} from "../shared/inventoryRenderUtils.js";
import {
  materialOptions,
  equippedMoveSelect,
  storageOptions,
} from "../shared/equipmentSelectors.js";
import {
  customFieldsBody,
  withEnchantmentBadge,
  cardTitleCell,
} from "../../../shared/renderUtils.js";
import {
  equippedItemTabs,
  itemTabsDetailRow,
  statsTabContent,
} from "../../../shared/itemTabs.js";
import { enchantmentsBody } from "../shared/enchantments/render.js";
import { getRangedItemCategory } from "../shared/enchantments/model.js";
import {
  weaponTypeSkillFields,
  weaponWeightPriceFields,
  weaponMaterialEffectField,
  weaponDescriptionField,
} from "../shared/weaponDetailFields.js";
import { sendToAllyRowHTML } from "../shared/sendToAllyControl.js";

// Ranged-local wrapper around withEnchantmentBadge — same relationship melee/render.js's withMeleeEnchantmentBadge has with it.
function withRangedEnchantmentBadge(finalValue, delta, suffix = "") {
  return withEnchantmentBadge(finalValue, delta, {
    suffix,
    title: t("ranged.enchantmentContribution"),
  });
}

function resolvedRanged(sheet, instanceId) {
  const inv = sheet?.inventory?.ranged;
  if (!inv) return null;

  return findInstance(
    [inv.equipped, inv.backpack, inv.stash, inv.camp],
    instanceId,
  );
}

function rangedDetailFields(resolved, weaponData) {
  const src = resolved ?? weaponData;
  if (!src) return [];
  return [
    ...weaponTypeSkillFields(src),
    {
      label: t("ranged.gdpMod"),
      value:
        resolved?.weapon_final_gdp_modifier ?? src.weapon_gdp_modifier ?? "—",
    },
    ...weaponWeightPriceFields(resolved, src, withRangedEnchantmentBadge),
    { label: t("ranged.minST"), value: src.weapon_min_strength ?? "—" },
    { label: t("ranged.damageType"), value: src.weapon_damage_type ?? "—" },
    ...(resolved?.weapon_gdp_damage != null
      ? [{ label: t("ranged.gdpDmg"), value: resolved.weapon_gdp_damage }]
      : []),
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
    ...weaponMaterialEffectField(resolved),
    weaponDescriptionField(weaponData),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedRanged(selected, data, sheet) {
  const equippedWeapons = selected.ranged_weapons.filter((w) => w.is_equipped);
  const names = [...new Set(data.ranged_weapons.map((w) => w.weapon_name))];

  if (equippedWeapons.length === 0) {
    setHTML(
      "rangedSlots",
      `<p class="empty-storage">${t("common.noEquipped")}</p>`,
    );
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
  const resolved = resolvedRanged(sheet, inst.id);
  const instanceId = inst.id;

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
        <button class="btn-remove remove-equipped-ranged" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    ${equippedItemTabs(instanceId, [
      {
        key: "details",
        label: t("common.technical"),
        content: statsTabContent(rangedDetailFields(resolved, weaponData)),
      },
      {
        key: "customize",
        label: t("common.customize"),
        content: customFieldsBody({
          instanceId,
          name: inst.weapon_custom_name,
          description: inst.weapon_custom_description,
          effect: inst.weapon_custom_effect,
        }),
      },
      {
        key: "enchantments",
        label: t("enchantments.title"),
        content: enchantmentsBody({
          instanceId,
          entries: inst.enchantments || [],
          itemCategory: getRangedItemCategory(),
          resolvedEntries: resolved?.enchantments,
        }),
      },
    ])}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredRanged(selected, data, sheet) {
  const stored = selected.ranged_weapons.filter((w) => !w.is_equipped);
  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderStorageSection(loc, stored, data, sheet),
  ).join("");
  setHTML("rangedStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const weapons = stored.filter((w) => w.storedAt === location);

  let bodyRows = "";
  if (weapons.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="7">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = weapons
      .map((inst) => {
        const weaponData = data.ranged_weapons.find(
          (w) => w.weapon_id === inst.weapon_id,
        );
        if (!weaponData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedRanged(sheet, inst.id);
        const instanceId = inst.id;

        return `
        <tr>
          ${cardTitleCell(weaponData.weapon_name)}
          <td data-label="${t("common.tier")}">${weaponData.weapon_tier}</td>
          <td data-label="${t("common.material")}">${material?.material_name ?? "—"}</td>
          <td class="col-num" data-label="${t("ranged.hp")}">
            ${hpModifierBlock({
              baseHp: weaponData.weapon_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-ranged-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td class="col-storage" data-label="${t("common.storage")}">
            <select class="ranged-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
            <button class="btn-remove remove-ranged" data-instance-id="${instanceId}">✕</button>
          </td>
          <td class="col-action">
            <button class="equip-stored-ranged" data-instance-id="${instanceId}">${t("common.equip")}</button>
          </td>
          <td class="col-send-ally" data-label="${t("inventory.sendToAlly.header")}">${sendToAllyRowHTML(instanceId)}</td>
        </tr>
        ${itemTabsDetailRow(7, instanceId, [
          {
            key: "details",
            label: t("common.technical"),
            content: statsTabContent(rangedDetailFields(resolved, weaponData)),
          },
          {
            key: "customize",
            label: t("common.customize"),
            content: customFieldsBody({
              instanceId,
              name: inst.weapon_custom_name,
              description: inst.weapon_custom_description,
              effect: inst.weapon_custom_effect,
            }),
          },
          {
            key: "enchantments",
            label: t("enchantments.title"),
            content: enchantmentsBody({
              instanceId,
              entries: inst.enchantments || [],
              itemCategory: getRangedItemCategory(),
              resolvedEntries: resolved?.enchantments,
            }),
          },
        ])}`;
      })
      .join("");
  }

  return renderStorageLocationBlock(
    location,
    STORAGE_LABELS[location],
    `<table>
      <thead>
        <tr>
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("ranged.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th><th class="col-send-ally">${t("inventory.sendToAlly.header")}</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`,
  );
}
