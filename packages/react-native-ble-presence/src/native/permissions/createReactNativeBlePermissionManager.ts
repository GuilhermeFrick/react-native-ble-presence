import { PermissionsAndroid, Platform } from 'react-native';
import type { BlePermissionManager, BlePermissionStatus } from '../../types';

export function createReactNativeBlePermissionManager(): BlePermissionManager {
  return {
    async checkPermissions() {
      if (Platform.OS !== 'android') {
        return 'unknown';
      }

      const permissions = getAndroidBlePermissions();
      const results = await Promise.all(
        permissions.map(async (permission) => PermissionsAndroid.check(permission)),
      );

      return results.every(Boolean) ? 'granted' : 'denied';
    },
    async requestPermissions() {
      if (Platform.OS !== 'android') {
        return 'unknown';
      }

      const permissions = getAndroidBlePermissions();
      const results = await PermissionsAndroid.requestMultiple(permissions);

      return mapAndroidPermissionResults(Object.values(results));
    },
  };
}

function getAndroidBlePermissions() {
  if (getAndroidApiLevel() >= 31) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
  }

  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

function getAndroidApiLevel(): number {
  return typeof Platform.Version === 'number' ? Platform.Version : Number.parseInt(Platform.Version, 10);
}

function mapAndroidPermissionResults(results: string[]): BlePermissionStatus {
  if (results.every((result) => result === PermissionsAndroid.RESULTS.GRANTED)) {
    return 'granted';
  }

  if (results.some((result) => result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) {
    return 'blocked';
  }

  return 'denied';
}
