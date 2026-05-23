import { bindUI } from "./events/index.js";
import { setupAutoRun } from "./engine/attributes.js";
import { updateActualValues } from "./ui.js";
import { runEngine } from "./engine/index.js";
import { initAutoRun } from "./engine/autorun.js";

// ===== INIT =====
window.onload = () => {
  initAutoRun(runEngine);

  bindUI();
  setupAutoRun();
  updateActualValues();

  runEngine();
};
