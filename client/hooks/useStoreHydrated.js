"use client";

import { useSyncExternalStore } from "react";

/**
 * True once a persisted Zustand store has rehydrated from LocalStorage.
 *
 * Modelled as an external store subscription rather than effect + setState:
 * the server snapshot is always false, so the server render and the first
 * client render agree, and React switches to the live value after hydration.
 */
export function useStoreHydrated(store) {
  return useSyncExternalStore(
    (onStoreChange) => store.persist.onFinishHydration(onStoreChange),
    () => store.persist.hasHydrated(),
    () => false
  );
}
