const STORAGE_KEY = "archivum:activeGroup";

export function getActiveGroup() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveGroup(key) {
  localStorage.setItem(STORAGE_KEY, key);
}
