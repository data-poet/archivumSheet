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
} from "../shared/inventoryRenderUtils.js";
import {
  materialOptions,
  equippedMoveSelect,
  storageOptions,
} from "../shared/equipmentSelectors.js";
import {
  formatRichText,
  detailRow,
  equippedDetailBlock,
  customFieldsEquippedDetail,
  customFieldsDetailRow,
} from "../../../shared/renderUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function resolvedFirearm(sheet, instanceId) {
  if (!sheet?.inventory?.firearms) return null;
  const inv = sheet.inventory.firearms;
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

function firearmDetailFields(resolved, weaponData) {
  const src = resolved ?? weaponData;
  if (!src) return [];
  return [
    { label: t("common.type"), value: src.weapon_type ?? "—" },
    { label: t("common.skill"), value: src.weapon_skill ?? "—" },
    { label: t("firearms.cdt"), value: src.weapon_cdt ?? "—" },
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
    ...(resolved?.material_atk_effect
      ? [
          {
            label: t("common.materialEffect"),
            value: formatRichText(resolved.material_atk_effect),
            rich: true,
          },
        ]
      : []),
    {
      label: t("common.description"),
      value: formatRichText(weaponData?.weapon_description),
      rich: true,
    },
  ];
}

/** Ammo counter + "Recarregar" button. */
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
      <button class="btn-reload reload-firearm" data-instance-id="${instanceId}">${t("firearms.reloadAction")}</button>
    </div>
  `;
}

/** Collapsible "Ajustes do Artificer" block: GDP / TR / PREC / magazine size runtime modifiers. */
function tuningBlock({ weaponData, inst, instanceId, prefix }) {
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

  return `
    <div class="equipped-detail firearm-tuning">
      <details>
        <summary>${t("firearms.tuning")}</summary>
        <div class="item-detail-grid">${content}</div>
      </details>
    </div>
  `;
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
  const resolved = resolvedFirearm(sheet, inst._instanceId);
  const instanceId = inst._instanceId;

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
    ${tuningBlock({ weaponData, inst, instanceId, prefix: "equipped" })}
    ${equippedDetailBlock(firearmDetailFields(resolved, weaponData))}
    ${customFieldsEquippedDetail({
      instanceId,
      name: inst.weapon_custom_name,
      description: inst.weapon_custom_description,
      effect: inst.weapon_custom_effect,
    })}
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

  let bodyRows;
  if (firearms.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = firearms
      .map((inst) => {
        const weaponData = data.firearms.find(
          (w) => w.weapon_id === inst.weapon_id,
        );
        if (!weaponData) return "";
        const material = resolveMaterial(inst, data.materials);
        const resolved = resolvedFirearm(sheet, inst._instanceId);
        const instanceId = inst._instanceId;

        const finalMagazineSize =
          resolved?.weapon_final_magazine_size ??
          weaponData.weapon_magazine_size ??
          0;

        return `
        <tr data-instance-id="${instanceId}">
          <td>${weaponData.weapon_name}</td>
          <td>${weaponData.weapon_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: weaponData.weapon_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-firearm-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="firearm-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-firearm" data-instance-id="${instanceId}">${t("common.equip")}</button>
            <button class="btn-remove remove-firearm" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>
        <tr data-instance-id="${instanceId}">
          <td colspan="6">
            ${magazineBlock({
              roundsLoaded: resolved?.rounds_loaded ?? inst.rounds_loaded ?? 0,
              magazineSize: finalMagazineSize,
              cssClass: "stored-firearm-rounds",
              instanceId,
            })}
          </td>
        </tr>
        ${detailRow(6, firearmDetailFields(resolved, weaponData))}
        <tr data-instance-id="${instanceId}">
          <td colspan="6">
            ${tuningBlock({ weaponData, inst, instanceId, prefix: "stored" })}
          </td>
        </tr>
        ${customFieldsDetailRow(6, {
          instanceId,
          name: inst.weapon_custom_name,
          description: inst.weapon_custom_description,
          effect: inst.weapon_custom_effect,
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
          <th>${t("common.name")}</th><th>${t("common.tier")}</th><th>${t("common.material")}</th>
          <th>${t("ranged.hp")}</th><th>${t("common.storage")}</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
  `;
}
