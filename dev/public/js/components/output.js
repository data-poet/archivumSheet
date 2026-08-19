// ===== OUTPUT =====
export function renderOutput(json) {
  document.getElementById("out").textContent = JSON.stringify(json, null, 2);
}
