const STORAGE_KEY = "archivum:viewMode";

export function isViewMode() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setViewMode(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}
