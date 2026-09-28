import { t } from "../../../localization/pt-BR/index.js";
import { formatRichText } from "../../../shared/renderUtils.js";
import { decimalToPercent } from "../../../components/resistances.js";

// Fields shared verbatim across melee/ranged/firearms — all three key off the
// same weapon_* fields, differing only in the badge wrapper used for weight/price.
export function weaponTypeSkillFields(src) {
  return [
    { label: t("common.type"), value: src.weapon_type ?? "—" },
    { label: t("common.skill"), value: src.weapon_skill ?? "—" },
  ];
}

export function weaponWeightPriceFields(resolved, src, withEnchantmentBadge) {
  return [
    {
      label: t("common.weight"),
      value: resolved
        ? withEnchantmentBadge(
            resolved.final_weight,
            decimalToPercent(resolved.enchantment_weight_modifier),
            "%",
          )
        : (src.weapon_weight ?? "—"),
    },
    {
      label: t("common.price"),
      value: resolved
        ? withEnchantmentBadge(
            resolved.total_value,
            resolved.enchantments_total_price,
          )
        : (src.weapon_price ?? "—"),
    },
  ];
}

export function weaponMaterialEffectField(resolved) {
  return resolved?.material_atk_effect
    ? [
        {
          label: t("common.materialEffect"),
          value: formatRichText(resolved.material_atk_effect),
          rich: true,
        },
      ]
    : [];
}

export function weaponDescriptionField(weaponData) {
  return {
    label: t("common.description"),
    value: formatRichText(weaponData?.weapon_description),
    rich: true,
  };
}
