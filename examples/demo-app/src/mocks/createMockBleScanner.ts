import type {
  BleScanResult,
  BleScanner,
  BleScannerListener,
  BleScannerOptions,
} from '@guilhermefrick/react-native-ble-presence';

const mockTags: Array<Omit<BleScanResult, 'rssi' | 'seenAt'>> = [
  {
    id: 'AA:BB:CC:DD:EE:01',
    platform: 'android',
    localName: 'BLE_TAG_01',
    macAddress: 'AA:BB:CC:DD:EE:01',
    manufacturerData: '4c000215e2c56db5dffb48d2b060d0f5a71096e000010001c5',
    serviceUuids: ['0000180f-0000-1000-8000-00805f9b34fb'],
  },
  {
    id: 'AA:BB:CC:DD:EE:02',
    platform: 'android',
    localName: 'BLE_TAG_02',
    macAddress: 'AA:BB:CC:DD:EE:02',
    manufacturerData: 'ffff001122334455',
    serviceUuids: ['0000feaa-0000-1000-8000-00805f9b34fb'],
  },
  {
    id: 'ios-peripheral-demo',
    platform: 'ios',
    localName: 'ROOM_BEACON',
    peripheralId: 'ios-peripheral-demo',
    serviceData: {
      '0000feaa-0000-1000-8000-00805f9b34fb': '0011223344556677',
    },
    serviceUuids: ['0000feaa-0000-1000-8000-00805f9b34fb'],
  },
];

export function createMockBleScanner(): BleScanner {
  const listeners = new Set<BleScannerListener>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let tick = 0;

  return {
    async startScan(options?: BleScannerOptions) {
      if (timer) {
        return;
      }

      emit(options);
      timer = setInterval(() => emit(options), 1500);
    },
    async stopScan() {
      if (!timer) {
        return;
      }

      clearInterval(timer);
      timer = null;
    },
    subscribe(listener: BleScannerListener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  function emit(options?: BleScannerOptions) {
    const now = new Date().toISOString();

    mockTags.forEach((tag, index) => {
      const rssi = -48 - index * 9 - (tick % 4);

      if (options?.minRssi !== undefined && rssi < options.minRssi) {
        return;
      }

      listeners.forEach((listener) =>
        listener({
          ...tag,
          rssi,
          seenAt: now,
        }),
      );
    });

    tick += 1;
  }
}

