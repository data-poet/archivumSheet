import { STORAGE_KEYS } from "../shared/storageKeys.js";

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.activeGroup;

export function getActiveGroup(storageKey = DEFAULT_STORAGE_KEY) {
  return localStorage.getItem(storageKey);
}

export function setActiveGroup(key, storageKey = DEFAULT_STORAGE_KEY) {
  localStorage.setItem(storageKey, key);
}
