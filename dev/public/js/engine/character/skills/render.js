import { icon } from "../../../shared/icons.js";
import { el } from "../../../shared/dom.js";
import { morphHTML } from "../../../shared/morph.js";
import { t } from "../../../localization/pt-BR/index.js";
import { conditionCell } from "../../../shared/conditionDisplay.js";
import {
  formatRichText,
  detailRow,
  numStepper,
  emptyRow,
  cardTitleCell,
  safeId,
} from "../../../shared/renderUtils.js";
import { dragHandleHTML } from "../../inventory/shared/inventoryRenderUtils.js";
import { sortByOrder } from "../../../shared/traitOrder.js";

export function renderSkills(selected, data, sheet) {
  const sheetSkills = sheet?.character?.skills ?? {};

  // Item-granted skills (is_enchantment: true) never appear in selected.skills, only in sheetSkills.
  const ids = sortByOrder(
    [
      ...new Set([
        ...Object.keys(selected.skills),
        ...Object.keys(sheetSkills),
      ]),
    ],
    selected.order?.skills,
  );

  const rows =
    ids.length === 0
      ? emptyRow(9)
      : ids
          .map((id) => {
            const skillState = selected.skills[id]; // undefined for pure grants
            const sheetSkill = sheetSkills[id]; // undefined until the engine has run once

            const skill = data.skills?.find((s) => s.skill_id === id);
            const name = skill?.skill_name ?? sheetSkill?.name ?? id;
            const diff =
              skill?.skill_difficulty ?? sheetSkill?.difficulty ?? "—";
            const attr =
              skill?.skill_base_attribute ?? sheetSkill?.attribute ?? "—";
            const book = skill?.skill_source_book ?? "—";
            const page = skill?.skill_source_page ?? "—";
            const desc = formatRichText(skill?.skill_description);
            const preDef = formatRichText(skill?.skill_pre_defined_level);

            const isEnchantment = sheetSkill?.is_enchantment ?? false;

            // On a grant/purchase collision, the engine picks whichever is higher; display that winning value, not the player's unused selection.
            const base = isEnchantment
              ? (sheetSkill?.base_value ?? 0)
              : (skillState?.base_value ?? skillState?.base ?? 0);
            const mod = isEnchantment
              ? (sheetSkill?.modifier ?? 0)
              : (skillState?.modifier ?? 0);

            const enchantmentMod = sheetSkill?.enchantment_modifier ?? 0;
            const hasEnchantment =
              sheetSkill?.has_enchantment_modifier ?? false;
            const enchantmentDisplay = hasEnchantment
              ? enchantmentMod > 0
                ? `+${enchantmentMod}`
                : `${enchantmentMod}`
              : "—";

            // base+mod is only a placeholder until the debounced engine call first completes.
            const final = sheetSkill?.value ?? base + mod;

            const finalCell =
              sheetSkill?.value != null
                ? conditionCell(sheetSkill, "value")
                : String(final);

            const parry = sheetSkill?.parry ?? null;
            const actions = sheetSkill?.actions ?? 1;

            const category = skill?.skill_category ?? "";
            const isEligible = (data.masterEligibleCategories ?? []).includes(
              category,
            );
            const isMaster = isEligible
              ? Boolean(skillState?.isTrainedWithMaster ?? false)
              : false;

            const detailItems = [
              {
                label: t("traits.source"),
                value: book !== "—" ? `${book} p.${page}` : "—",
              },
            ];

            if (parry !== null) {
              detailItems.push({
                label: t("traits.parry"),
                value: conditionCell(sheetSkill, "parry"),
              });
            }

            if (isEligible && !isEnchantment) {
              detailItems.push({
                label: t("traits.actions"),
                value: String(actions),
              });
              detailItems.push({
                label: t("traits.trainedWithMaster"),
                value: `<label class="checkbox-label">
                  <input
                    type="checkbox"
                    class="skill-master-checkbox"
                    data-id="${id}"
                    ${isMaster ? "checked" : ""}
                  />
                </label>`,
                rich: true,
              });
            }

            detailItems.push({
              label: t("traits.description"),
              value: desc,
              rich: true,
            });

            detailItems.push({
              label: t("traits.preDef"),
              value: preDef,
              rich: true,
            });

            const baseCell = isEnchantment
              ? `<td class="col-num" data-label="${t("traits.base")}">${base}</td>`
              : `<td class="col-num" data-label="${t("traits.base")}">
                  ${numStepper("skill-input", `data-id="${id}" data-field="base_value"`, base)}
                </td>`;

            const modCell = isEnchantment
              ? `<td class="col-num" data-label="${t("traits.mod")}">${mod}</td>`
              : `<td class="col-num" data-label="${t("traits.mod")}">
                  ${numStepper("skill-input", `data-id="${id}" data-field="modifier"`, mod)}
                </td>`;

            // Item-granted rows have nothing to remove, same as innate advantages — and nothing to drag.
            const actionCell = isEnchantment
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-skill" data-id="${id}">${icon("remove")}</button></td>`;
            const dragCell = isEnchantment
              ? `<td class="col-drag"></td>`
              : `<td class="col-drag" data-label="${t("common.dragHandle")}">${dragHandleHTML()}</td>`;

            const enchantmentTag = isEnchantment
              ? `<span class="trait-enchantment-tag">${t("character.enchanted")}</span>`
              : "";

            return `
          <tr id="skill-${safeId(id)}" class="${isEnchantment ? "trait-enchantment" : ""}" data-id="${id}">
            ${dragCell}
            ${cardTitleCell(`${name}${enchantmentTag}`)}
            <td class="col-center" data-label="${t("traits.attr")}">${attr}</td>
            <td class="col-center" data-label="${t("traits.diff")}">${diff}</td>
            ${baseCell}
            ${modCell}
            <td class="col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}" data-label="${t("traits.enchantment")}">${enchantmentDisplay}</td>
            <td class="col-num" data-label="${t("traits.final")}"><strong>${finalCell}</strong></td>
            ${actionCell}
          </tr>
          ${detailRow(9, detailItems, `skill-${safeId(id)}`)}`;
          })
          .join("");

  morphHTML(
    el("skillList"),
    `
    <div class="table-wrapper table-wrapper--stack"><table>
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th>${t("traits.name")}</th>
          <th class="col-center">${t("traits.attr")}</th>
          <th class="col-center">${t("traits.diff")}</th>
          <th class="col-num">${t("traits.base")}</th>
          <th class="col-num">${t("traits.mod")}</th>
          <th class="col-num">${t("traits.enchantment")}</th>
          <th class="col-num">${t("traits.final")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody id="skill-tbody">${rows}</tbody>
    </table></div>
  `,
  );
}
