import {
  t,
  getElementalResistanceLabel,
} from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { decimalToPercent } from "../resistances.js";
import { collapsibleHeader, bindCollapse } from "./shared.js";

export function renderResumeElementalResistances(sheet) {
  const resistances = sheet?.character?.elemental_resistances || {};
  const entries = Object.entries(resistances).filter(
    ([, data]) => data.final !== 1,
  );
  const container = el("resume_elemental_resistances_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(
      ([type, data]) => `
      <tr>
        <td>${getElementalResistanceLabel(type)}</td>
        <td class="col-num">${decimalToPercent(data.final)}%</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("resume.elementalResistances"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--elemental-resistances">
          <thead>
            <tr>
              <th>${t("attributes.type")}</th>
              <th class="col-num">${t("attributes.finalDamageReceived")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}
