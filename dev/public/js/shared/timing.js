// Opt-in: set localStorage[archivum:debugTiming] = "1" and reload to see each engine run's
// breakdown in the console. No UI, no effect on anyone who hasn't flipped the flag themselves.

import { STORAGE_KEYS } from "./storageKeys.js";

export function isTimingEnabled() {
  return localStorage.getItem(STORAGE_KEYS.debugTiming) === "1";
}

export function mark() {
  return performance.now();
}

export function logRunTiming(entry) {
  console.table(entry);
}
