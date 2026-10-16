import { STORAGE_KEYS } from "../shared/storageKeys.js";

const STORAGE_KEY = STORAGE_KEYS.viewMode;

export function isViewMode() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setViewMode(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}
