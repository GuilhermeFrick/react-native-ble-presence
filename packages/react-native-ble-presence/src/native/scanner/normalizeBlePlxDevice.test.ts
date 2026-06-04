import { describe, expect, it } from 'vitest';
import { normalizeBlePlxDevice } from './normalizeBlePlxDevice';

describe('normalizeBlePlxDevice', () => {
  it('maps Android device id as mac address', () => {
    expect(
      normalizeBlePlxDevice(
        {
          id: 'AA:BB:CC:DD:EE:FF',
          name: 'Tag 01',
          rssi: -62,
          manufacturerData: '4C000215',
        },
        {
          platform: 'android',
          seenAt: '2026-06-04T12:00:00.000Z',
        },
      ),
    ).toMatchObject({
      id: 'AA:BB:CC:DD:EE:FF',
      platform: 'android',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      peripheralId: undefined,
      localName: 'Tag 01',
      manufacturerData: '4C000215',
      rssi: -62,
    });
  });

  it('maps iOS device id as peripheral id', () => {
    expect(
      normalizeBlePlxDevice(
        {
          id: '4F2B2BC1-0A8E-4F16-A3AF-A3C714C0C7D8',
          localName: 'Beacon A',
          serviceUUIDs: ['0000180F-0000-1000-8000-00805F9B34FB'],
        },
        {
          platform: 'ios',
          seenAt: '2026-06-04T12:00:00.000Z',
        },
      ),
    ).toMatchObject({
      id: '4F2B2BC1-0A8E-4F16-A3AF-A3C714C0C7D8',
      platform: 'ios',
      macAddress: undefined,
      peripheralId: '4F2B2BC1-0A8E-4F16-A3AF-A3C714C0C7D8',
      localName: 'Beacon A',
      serviceUuids: ['0000180f-0000-1000-8000-00805f9b34fb'],
    });
  });
});

