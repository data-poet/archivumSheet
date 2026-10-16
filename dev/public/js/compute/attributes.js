import { triggerAutoRun } from "./autorun.js";
import { PRIMARY_ATTRIBUTES } from "../shared/constants.js";

const _field = (id) => Number(document.getElementById(id).value);

export function getPrimaryAttributes() {
  return Object.fromEntries(
    PRIMARY_ATTRIBUTES.map((attr) => [
      attr,
      { base_value: _field(`${attr}_base`), modifier: _field(`${attr}_mod`) },
    ]),
  );
}

export function setupAutoRun() {
  [
    ...PRIMARY_ATTRIBUTES.flatMap((attr) => [`${attr}_base`, `${attr}_mod`]),
    "weight",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", triggerAutoRun);
  });
}
