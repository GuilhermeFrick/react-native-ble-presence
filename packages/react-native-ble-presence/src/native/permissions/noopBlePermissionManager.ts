import type { BlePermissionManager } from '../../types';

export function createNoopBlePermissionManager(): BlePermissionManager {
  return {
    async checkPermissions() {
      return 'unknown';
    },
    async requestPermissions() {
      return 'unknown';
    },
  };
}

