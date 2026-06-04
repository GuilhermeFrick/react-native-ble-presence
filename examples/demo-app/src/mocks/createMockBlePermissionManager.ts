import type { BlePermissionManager } from '@guilhermefrick/react-native-ble-presence';

export function createMockBlePermissionManager(): BlePermissionManager {
  return {
    async checkPermissions() {
      return 'granted';
    },
    async requestPermissions() {
      return 'granted';
    },
  };
}

