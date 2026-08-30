"use client";

import { useCallback, useEffect, useState } from "react";

import { toMessage } from "@/lib/core/errors";

const INITIAL = { status: "loading", data: null, error: null };

/**
 * Loads data from a repository/controller and tracks loading/error status.
 *
 * State is only ever set after an await, never synchronously in the effect
 * body, and in-flight results are dropped once the inputs change — so a slow
 * response can't overwrite a newer one.
 *
 * @param loader  async function returning the data
 * @param deps    values the loader depends on; a change refetches
 * @param enabled skip fetching until prerequisites (e.g. auth) are ready
 */
export function useAsyncData(loader, deps = [], enabled = true) {
  const [state, setState] = useState(INITIAL);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const data = await loader();
        if (!cancelled) setState({ status: "ready", data, error: null });
      } catch (error) {
        if (!cancelled) setState({ status: "error", data: null, error: toMessage(error) });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `loader` is intentionally excluded: callers pass an inline closure, and
    // `deps` is the explicit list of values it actually reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadToken, ...deps]);

  const reload = useCallback(() => {
    setState(INITIAL);
    setReloadToken((token) => token + 1);
  }, []);

  return { ...state, reload };
}
