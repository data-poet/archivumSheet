import { bindUI } from "./core/events.js";
import { setupAutoRun } from "./core/attributes/attributesPrimary.js";
import { updateActualValues } from "./ui.js";
import { runEngine } from "./core/engine.js";
import { initAutoRun } from "./core/autorun.js";

// ===== INIT =====
window.onload = () => {
  initAutoRun(runEngine);

  bindUI();
  setupAutoRun();
  updateActualValues();

  runEngine();
};
