import { triggerAutoRun } from "../autorun.js";

// ===== PRIMARY ATTRIBUTES =====
export function getPrimaryAttributes() {
  return {
    ST: {
      base_value: Number(document.getElementById("ST_base").value),
      modifier: Number(document.getElementById("ST_mod").value),
    },
    DX: {
      base_value: Number(document.getElementById("DX_base").value),
      modifier: Number(document.getElementById("DX_mod").value),
    },
    IQ: {
      base_value: Number(document.getElementById("IQ_base").value),
      modifier: Number(document.getElementById("IQ_mod").value),
    },
    HT: {
      base_value: Number(document.getElementById("HT_base").value),
      modifier: Number(document.getElementById("HT_mod").value),
    },
  };
}

// ===== AUTO-RUN SETUP =====
export function setupAutoRun() {
  [
    "ST_base",
    "ST_mod",
    "DX_base",
    "DX_mod",
    "IQ_base",
    "IQ_mod",
    "HT_base",
    "HT_mod",
    "weight",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", triggerAutoRun);
  });
}
