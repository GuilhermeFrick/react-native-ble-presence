import { describe, expect, it } from 'vitest';
import { buildFingerprint } from './buildFingerprint';
import type { BleScanResult } from '../../types';

describe('buildFingerprint', () => {
  it('detects iBeacon payload from manufacturer data', () => {
    const scanResult: BleScanResult = {
      id: 'tag-1',
      platform: 'ios',
      rssi: -55,
      manufacturerData: '4c000215e2c56db5dffb48d2b060d0f5a71096e0000a002dc5',
      peripheralId: 'peripheral-1',
      seenAt: '2026-06-04T12:00:00.000Z',
    };

    expect(buildFingerprint(scanResult, { createdAt: scanResult.seenAt })).toMatchObject({
      beacon: {
        type: 'ibeacon',
        uuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
        major: 10,
        minor: 45,
      },
      quality: 'high',
    });
  });
});

