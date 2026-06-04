import type { BleScanner } from '../../types';

export function createNoopBleScanner(): BleScanner {
  return {
    async startScan() {
      return undefined;
    },
    async stopScan() {
      return undefined;
    },
    subscribe() {
      return () => undefined;
    },
  };
}

