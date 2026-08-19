import { setHTML } from "../../../shared/dom.js";
import { t } from "../../../localization/pt-BR.js";
import {
  formatRichText,
  detailRow,
  numStepper,
  emptyRow,
} from "../../../shared/renderUtils.js";

// Categories that support isTrainedWithMaster and the actions formula
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

// ===== SKILLS =====

export function renderSkills(selected, data, sheet) {
  const sheetSkills = sheet?.character?.skills ?? {};

  // Union of the player's own selection and engine-granted ids — a purely
  // item-granted skill (is_enchantment: true) never appears in
  // selected.skills at all, only in the engine's computed output.
  const ids = [
    ...new Set([...Object.keys(selected.skills), ...Object.keys(sheetSkills)]),
  ];

  const rows =
    ids.length === 0
      ? emptyRow(8)
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

            // Show the WINNING source's base/mod — if the engine picked the
            // grant over the player's own purchase (is_enchantment: true,
            // "whichever is higher" collision), display the grant's values,
            // not the player's losing selection sitting unused in state.
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

            // Final value: read straight from the engine (source of truth).
            // Falls back to a local base+mod estimate only for the brief
            // window before the debounced engine call first completes.
            const final = sheetSkill?.value ?? base + mod;

            const parry = sheetSkill?.parry ?? null;
            const actions = sheetSkill?.actions ?? 1;

            // isTrainedWithMaster — driven by selected state, constrained to eligible categories
            const category = skill?.skill_category ?? "";
            const isEligible = MASTER_ELIGIBLE_CATEGORIES.has(category);
            const isMaster = isEligible
              ? Boolean(skillState?.isTrainedWithMaster ?? false)
              : false;

            // ── Detail items ─────────────────────────────────────────────────
            const detailItems = [
              {
                label: t("traits.source"),
                value: book !== "—" ? `${book} p.${page}` : "—",
              },
            ];

            if (parry !== null) {
              detailItems.push({
                label: t("traits.parry"),
                value: String(parry),
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
              ? `<td class="col-num">${base}</td>`
              : `<td class="col-num">
                  ${numStepper("skill-input", `data-id="${id}" data-field="base_value"`, base)}
                </td>`;

            const modCell = isEnchantment
              ? `<td class="col-num">${mod}</td>`
              : `<td class="col-num">
                  ${numStepper("skill-input", `data-id="${id}" data-field="modifier"`, mod)}
                </td>`;

            // Item-granted rows have nothing in the player's own selection
            // to remove — same treatment as innate advantages.
            const actionCell = isEnchantment
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-skill" data-id="${id}">✕</button></td>`;

            const enchantmentTag = isEnchantment
              ? `<span class="trait-enchantment-tag">${t("character.enchanted")}</span>`
              : "";

            return `
          <tr class="${isEnchantment ? "trait-enchantment" : ""}">
            <td>${name}${enchantmentTag}</td>
            <td class="col-center">${attr}</td>
            <td class="col-center">${diff}</td>
            ${baseCell}
            ${modCell}
            <td class="col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}">${enchantmentDisplay}</td>
            <td class="col-num"><strong>${final}</strong></td>
            ${actionCell}
          </tr>
          ${detailRow(8, detailItems)}`;
          })
          .join("");

  setHTML(
    "skillList",
    `
    <div class="table-wrapper"><table>
      <thead>
        <tr>
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
      <tbody>${rows}</tbody>
    </table></div>
  `,
  );
}
