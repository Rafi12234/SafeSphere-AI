import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only after mounting on the client.
 * Safe for SSR and avoids React 19 setState-in-effect cascading renders.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
