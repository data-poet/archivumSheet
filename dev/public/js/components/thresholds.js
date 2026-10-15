import { LABELS } from "../localization/pt-BR/index.js";

const PANEL_ID = "thresholdsPanel";

export function formatThresholdNumber(n) {
  return String(Math.round(n));
}

export function fillThreshold(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key === "list" ? values.list : formatThresholdNumber(values[key]),
  );
}

export function thresholdChip(kind, block) {
  const states = LABELS.thresholds.states[kind] ?? {};
  const key =
    block?.state === "dying" && block.death_checks === 1
      ? "dyingOne"
      : block?.state;
  const text = states[key];
  if (!text) return "";
  return `<span class="threshold-chip threshold-chip--${block.state}">${fillThreshold(text, { x: block.death_checks })}</span>`;
}

function _table(title, column, rows, values) {
  const body = rows
    .map(
      ([key, when, effect]) => `
        <tr>
          <td class="thresholds-value">${fillThreshold(when, values[key])}</td>
          <td>${effect}</td>
        </tr>`,
    )
    .join("");
  return `
    <div class="thresholds-block">
      <h4 class="thresholds-title">${title}</h4>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>${column}</th><th>${LABELS.thresholds.effect}</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderThresholds(sheet) {
  const panel = document.getElementById(PANEL_ID);
  const t = sheet?.character?.thresholds;
  if (!panel || !t) return;

  const L = LABELS.thresholds;
  const chips = thresholdChip("hp", t.hp) + thresholdChip("fp", t.fp);

  panel.innerHTML = `
    <p class="thresholds-state">${chips || `<span class="threshold-chip threshold-chip--ok">${L.noEffects}</span>`}</p>
    <div class="thresholds-grid">
      ${_table(L.wounds, LABELS.secondaryAttributes.HP, L.hpRows, {
        majorWound: { x: t.hp.major_wound_over },
        headStun: { x: t.hp.head_stun_over },
        reeling: { x: t.hp.reeling_below },
        deathChecks: { list: t.hp.death_check_values.join(" · ") },
        death: { x: t.hp.death_at },
        destroyed: { x: t.hp.destroyed_at },
      })}
      ${_table(L.fatigue, LABELS.secondaryAttributes.FP, L.fpRows, {
        exhausted: { x: t.fp.exhausted_below },
        unconscious: { x: t.fp.unconscious_at },
      })}
    </div>
    <p class="thresholds-ht">${fillThreshold(L.basedOn, { x: t.ht })}</p>`;
}
