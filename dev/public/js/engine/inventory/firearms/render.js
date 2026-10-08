import { t } from "../../../localization/pt-BR/index.js";
import { setHTML } from "../../../shared/dom.js";
import {
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
} from "../../../shared/constants.js";
import { resolveMaterial } from "../shared/durabilityUtils.js";
import {
  hpModifierBlock,
  statModifierBlock,
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
import { getFirearmsItemCategory } from "../shared/enchantments/model.js";
import {
  sendToAllyRowHTML,
  hasLinkedAllies,
} from "../shared/sendToAllyControl.js";
import { getActiveCharacterId } from "../../../store/characters.js";
import {
  weaponTypeSkillFields,
  weaponWeightPriceFields,
  weaponMaterialEffectField,
  weaponDescriptionField,
} from "../shared/weaponDetailFields.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Firearms-local wrapper around withEnchantmentBadge, same relationship melee/ranged's wrappers have with it.
function withFirearmEnchantmentBadge(finalValue, delta, suffix = "") {
  return withEnchantmentBadge(finalValue, delta, {
    suffix,
    title: t("firearms.enchantmentContribution"),
  });
}

function resolvedFirearm(sheet, instanceId) {
  const inv = sheet?.inventory?.firearms;
  if (!inv) return null;

  return findInstance(
    [inv.equipped, inv.backpack, inv.stash, inv.camp],
    instanceId,
  );
}

function firearmDetailFields(resolved, weaponData) {
  const src = resolved ?? weaponData;
  if (!src) return [];
  return [
    ...weaponTypeSkillFields(src),
    { label: t("firearms.cdt"), value: src.weapon_cdt ?? "—" },
    ...weaponWeightPriceFields(resolved, src, withFirearmEnchantmentBadge),
    { label: t("ranged.minST"), value: src.weapon_min_strength ?? "—" },
    { label: t("ranged.damageType"), value: src.weapon_damage_type ?? "—" },
    ...(resolved?.weapon_gdp_damage != null
      ? [{ label: t("ranged.gdpDmg"), value: resolved.weapon_gdp_damage }]
      : []),
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

function magazineBlock({ roundsLoaded, magazineSize, cssClass, instanceId }) {
  return `
    <div class="hp-modifier">
      ${t("firearms.magazine")}:
      <div class="num-stepper">
        <input
          type="text"
          inputmode="numeric"
          class="${cssClass}"
          data-instance-id="${instanceId}"
          data-min="0"
          data-max="${magazineSize}"
          value="${roundsLoaded ?? 0}"
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
          <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
        </div>
      </div>
      / <strong>${magazineSize}</strong>
    </div>
  `;
}

function tuningBody({ weaponData, inst, instanceId, prefix }) {
  const content = [
    statModifierBlock({
      label: t("ranged.gdpMod"),
      baseValue: weaponData.weapon_gdp_modifier,
      modifier: inst.gdp_modifier,
      cssClass: `${prefix}-firearm-gdp`,
      dataAttrs: `data-instance-id="${instanceId}"`,
    }),
    statModifierBlock({
      label: t("ranged.tr"),
      baseValue: weaponData.weapon_tr,
      modifier: inst.tr_modifier,
      cssClass: `${prefix}-firearm-tr`,
      dataAttrs: `data-instance-id="${instanceId}"`,
    }),
    statModifierBlock({
      label: t("ranged.prec"),
      baseValue: weaponData.weapon_prec,
      modifier: inst.prec_modifier,
      cssClass: `${prefix}-firearm-prec`,
      dataAttrs: `data-instance-id="${instanceId}"`,
    }),
    statModifierBlock({
      label: t("firearms.magazineMod"),
      baseValue: weaponData.weapon_magazine_size,
      modifier: inst.magazine_size_modifier,
      cssClass: `${prefix}-firearm-magazine-mod`,
      dataAttrs: `data-instance-id="${instanceId}"`,
    }),
  ].join("");

  return `<div class="item-detail-grid">${content}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED FIREARMS
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedFirearms(selected, data, sheet) {
  const equippedFirearms = selected.firearms.filter((w) => w.is_equipped);
  const names = [...new Set(data.firearms.map((w) => w.weapon_name))];

  if (equippedFirearms.length === 0) {
    setHTML(
      "firearmSlots",
      `<p class="empty-storage">${t("common.noEquipped")}</p>`,
    );
    return;
  }

  setHTML(
    "firearmSlots",
    equippedFirearms
      .map((inst) => renderEquippedFirearmSlot(inst, names, data, sheet))
      .join(""),
  );
}

function renderEquippedFirearmSlot(inst, names, data, sheet) {
  const weaponData = data.firearms.find((w) => w.weapon_id === inst.weapon_id);
  if (!weaponData) return "";

  const tiers = data.firearms
    .filter((w) => w.weapon_name === weaponData.weapon_name)
    .map((w) => w.weapon_tier);

  const material = resolveMaterial(inst, data.materials);
  const resolved = resolvedFirearm(sheet, inst.id);
  const instanceId = inst.id;

  const finalMagazineSize =
    resolved?.weapon_final_magazine_size ??
    weaponData.weapon_magazine_size ??
    0;

  return `
    <div class="equipped-slot-grid" data-instance-id="${instanceId}">
      <div class="equipped-slot-label">${t("firearms.firearm")}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-firearm-name" data-instance-id="${instanceId}">
          ${names
            .map(
              (name) =>
                `<option value="${name}" ${weaponData.weapon_name === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-firearm-tier" data-instance-id="${instanceId}">
          ${tiers
            .map(
              (tier) =>
                `<option value="${tier}" ${weaponData.weapon_tier === tier ? "selected" : ""}>${tier}</option>`,
            )
            .join("")}
        </select>
        <select class="equipped-firearm-material" data-instance-id="${instanceId}">
          ${materialOptions(data.materials, inst.material_id)}
        </select>
        ${hpModifierBlock({
          baseHp: weaponData.weapon_hit_points ?? 0,
          material,
          hpModifier: inst.hit_points_modifier,
          cssClass: "equipped-firearm-hp",
          dataAttrs: `data-instance-id="${instanceId}"`,
        })}
        ${magazineBlock({
          roundsLoaded: resolved?.rounds_loaded ?? inst.rounds_loaded ?? 0,
          magazineSize: finalMagazineSize,
          cssClass: "equipped-firearm-rounds",
          instanceId,
        })}
        ${equippedMoveSelect("equipped-firearm-move", `data-instance-id="${instanceId}"`)}
        <button class="btn-remove remove-equipped-firearm" data-instance-id="${instanceId}">✕</button>
      </div>
    </div>
    ${equippedItemTabs(instanceId, [
      {
        key: "details",
        label: t("common.technical"),
        content: statsTabContent(firearmDetailFields(resolved, weaponData)),
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
          itemCategory: getFirearmsItemCategory(),
          resolvedEntries: resolved?.enchantments,
        }),
      },
      {
        key: "tuning",
        label: t("firearms.tuning"),
        content: tuningBody({
          weaponData,
          inst,
          instanceId,
          prefix: "equipped",
        }),
      },
    ])}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED FIREARMS
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredFirearms(selected, data, sheet) {
  const stored = selected.firearms.filter((w) => !w.is_equipped);
  const sections = STORAGE_LOCATIONS.map((loc) =>
    renderStorageSection(loc, stored, data, sheet),
  ).join("");
  setHTML("firearmStorageList", sections);
}

function renderStorageSection(location, stored, data, sheet) {
  const firearms = stored.filter((w) => w.storedAt === location);
  const showSendToAlly = hasLinkedAllies(getActiveCharacterId());
  const colCount = showSendToAlly ? 7 : 6;

  let bodyRows;
  if (firearms.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="${colCount}">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = firearms
      .map((inst) => {
        const weaponData = data.firearms.find(
          (w) => w.weapon_id === inst.weapon_id,
        );
        if (!weaponData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedFirearm(sheet, inst.id);
        const instanceId = inst.id;

        const finalMagazineSize =
          resolved?.weapon_final_magazine_size ??
          weaponData.weapon_magazine_size ??
          0;

        return `
        <tr data-instance-id="${instanceId}">
          ${cardTitleCell(weaponData.weapon_name)}
          <td data-label="${t("common.tier")}">${weaponData.weapon_tier}</td>
          <td data-label="${t("common.material")}">${material?.material_name ?? "—"}</td>
          <td class="col-num" data-label="${t("ranged.hp")}">
            ${hpModifierBlock({
              baseHp: weaponData.weapon_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-firearm-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td class="col-storage" data-label="${t("common.storage")}">
            <select class="firearm-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
            <button class="btn-remove remove-firearm" data-instance-id="${instanceId}">✕</button>
          </td>
          <td class="col-action">
            <button class="equip-stored-firearm" data-instance-id="${instanceId}">${t("common.equip")}</button>
          </td>
          ${showSendToAlly ? `<td class="col-send-ally" data-label="${t("inventory.sendToAlly.header")}">${sendToAllyRowHTML(instanceId)}</td>` : ""}
        </tr>
        <tr class="magazine-row" data-instance-id="${instanceId}">
          <td colspan="${colCount}">
            ${magazineBlock({
              roundsLoaded: resolved?.rounds_loaded ?? inst.rounds_loaded ?? 0,
              magazineSize: finalMagazineSize,
              cssClass: "stored-firearm-rounds",
              instanceId,
            })}
          </td>
        </tr>
        ${itemTabsDetailRow(colCount, instanceId, [
          {
            key: "details",
            label: t("common.technical"),
            content: statsTabContent(firearmDetailFields(resolved, weaponData)),
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
              itemCategory: getFirearmsItemCategory(),
              resolvedEntries: resolved?.enchantments,
            }),
          },
          {
            key: "tuning",
            label: t("firearms.tuning"),
            content: tuningBody({
              weaponData,
              inst,
              instanceId,
              prefix: "stored",
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
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("ranged.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>${showSendToAlly ? `<th class="col-send-ally">${t("inventory.sendToAlly.header")}</th>` : ""}
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`,
  );
}
