"use client";

import { useSyncExternalStore } from "react";
import {
  CURRENT_VERSION,
  MAX_EVENTS,
  STORAGE_KEY,
  defaultState,
  deserializeState,
  serializeState,
  type AppState,
  type EventName,
} from "./schema";

/**
 * Single client-side store backed by localStorage.
 * All pages subscribe via useSyncExternalStore, so every mounted view stays in
 * sync after any update (including other tabs, via the `storage` event).
 * If localStorage is unavailable (private mode, blocked), the store keeps
 * working in memory and `storageMode` reports it so the UI can say so.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let state: AppState | null = null;
let storageMode: "local" | "memory" = "local";
let recoveredFromCorruption = false;

function readFromStorage(): AppState {
  try {
    const { state: loaded, reset } = deserializeState(window.localStorage.getItem(STORAGE_KEY));
    recoveredFromCorruption = reset;
    return loaded;
  } catch {
    storageMode = "memory";
    return defaultState();
  }
}

function persist() {
  if (!state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeState(state));
    storageMode = "local";
  } catch {
    storageMode = "memory";
  }
}

function ensureLoaded(): AppState {
  if (state === null) state = readFromStorage();
  return state;
}

function emit() {
  for (const l of listeners) l();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = readFromStorage();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getState(): AppState {
  return ensureLoaded();
}

const SERVER_STATE = defaultState(0);

export function updateState(recipe: (draft: AppState) => AppState) {
  state = recipe(ensureLoaded());
  persist();
  emit();
}

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  updateState((s) => ({
    ...s,
    events: [...s.events, { name, at: Date.now(), props }].slice(-MAX_EVENTS),
  }));
}

export function resetAll() {
  state = defaultState();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  persist();
  emit();
}

export function getStorageInfo() {
  return { mode: storageMode, recoveredFromCorruption, version: CURRENT_VERSION };
}

/** Current app state. Returns a stable default during SSR / before hydration. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

/** False during SSR and the first client render; true once state is readable. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function noopSubscribe() {
  return () => {};
}
