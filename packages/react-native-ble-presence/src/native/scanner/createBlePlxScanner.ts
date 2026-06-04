import { Platform } from 'react-native';
import { BleManager, type Device, type ScanOptions } from 'react-native-ble-plx';
import type { BlePlatform, BleScanner, BleScannerListener, BleScannerOptions } from '../../types';
import { normalizeBlePlxDevice } from './normalizeBlePlxDevice';

export type BlePlxScannerOptions = {
  manager?: Pick<BleManager, 'startDeviceScan' | 'stopDeviceScan'>;
  clock?: () => string;
  platform?: BlePlatform;
  serviceUuids?: string[] | null;
};

export function createBlePlxScanner(options: BlePlxScannerOptions = {}): BleScanner {
  const manager = options.manager ?? new BleManager();
  const listeners = new Set<BleScannerListener>();
  const clock = options.clock ?? (() => new Date().toISOString());
  const platform = options.platform ?? resolvePlatform();
  let isScanning = false;

  return {
    async startScan(scannerOptions?: BleScannerOptions) {
      if (isScanning) {
        return;
      }

      isScanning = true;
      manager.startDeviceScan(options.serviceUuids ?? null, toScanOptions(scannerOptions), (error, device) => {
        if (error || !device) {
          return;
        }

        const scanResult = normalizeBlePlxDevice(toDeviceLike(device), {
          platform,
          seenAt: clock(),
        });

        listeners.forEach((listener) => listener(scanResult));
      });
    },
    async stopScan() {
      if (!isScanning) {
        return;
      }

      manager.stopDeviceScan();
      isScanning = false;
    },
    subscribe(listener: BleScannerListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function toScanOptions(options: BleScannerOptions | undefined): ScanOptions {
  return {
    allowDuplicates: options?.allowDuplicates,
  };
}

function toDeviceLike(device: Device) {
  return {
    id: device.id,
    name: device.name,
    localName: device.localName,
    rssi: device.rssi,
    manufacturerData: device.manufacturerData,
    serviceData: device.serviceData,
    serviceUUIDs: device.serviceUUIDs,
  };
}

function resolvePlatform(): BlePlatform {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return Platform.OS;
  }

  return 'unknown';
}

