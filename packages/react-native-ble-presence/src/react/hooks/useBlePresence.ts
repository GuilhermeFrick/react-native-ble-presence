import { useContext } from 'react';
import { BlePresenceContext, type BlePresenceContextValue } from '../BlePresenceContext';

export function useBlePresence<TEntityId extends string = string>(): BlePresenceContextValue<TEntityId> {
  const context = useContext(BlePresenceContext);

  if (!context) {
    throw new Error('useBlePresence must be used inside BlePresenceProvider.');
  }

  return context as BlePresenceContextValue<TEntityId>;
}

