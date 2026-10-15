const DEFAULT_STORAGE_KEY = "archivum:activeGroup";

export function getActiveGroup(storageKey = DEFAULT_STORAGE_KEY) {
  return localStorage.getItem(storageKey);
}

export function setActiveGroup(key, storageKey = DEFAULT_STORAGE_KEY) {
  localStorage.setItem(storageKey, key);
}
