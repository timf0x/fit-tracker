import { createContext, useContext } from 'react';

/**
 * Home screen refresh context.
 * Value is a counter that increments on each pull-to-refresh.
 * Cards use `useHomeRefreshKey()` to trigger replay animations.
 */
export const HomeRefreshContext = createContext(0);

export function useHomeRefreshKey(): number {
  return useContext(HomeRefreshContext);
}
