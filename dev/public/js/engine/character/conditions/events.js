import { setCondition, toggleCondition, clearConditions } from "./model.js";

export function handleConditionClick(e) {
  const remove = e.target.closest?.(".condition-remove");
  if (remove) {
    toggleCondition(remove.dataset.conditionKey);
    return true;
  }

  if (e.target.closest?.(".conditions-clear")) {
    clearConditions();
    return true;
  }

  return false;
}

export function handleConditionChange(e) {
  if (!e.target.classList?.contains("condition-toggle")) return false;

  setCondition(e.target.dataset.conditionKey, e.target.checked);
  return true;
}
