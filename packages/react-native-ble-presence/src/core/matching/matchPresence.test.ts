import { describe, expect, it } from 'vitest';
import { buildFingerprint } from '../fingerprint/buildFingerprint';
import { matchPresence } from './matchPresence';
import type { BleScanResult, RegisteredTag } from '../../types';

const baseScan: BleScanResult = {
  id: 'scan-1',
  platform: 'android',
  rssi: -60,
  localName: 'Tag 01',
  seenAt: '2026-06-04T12:00:00.000Z',
};

describe('matchPresence', () => {
  it('matches by beacon payload with high confidence', () => {
    const scan: BleScanResult = {
      ...baseScan,
      beacon: {
        type: 'ibeacon',
        uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0F',
        major: 10,
        minor: 45,
      },
    };

    const registeredTags: RegisteredTag[] = [
      {
        entityId: 'entity-1',
        fingerprint: buildFingerprint(scan, { id: 'tag-1', createdAt: scan.seenAt }),
      },
    ];

    expect(matchPresence(scan, registeredTags)).toMatchObject({
      entityId: 'entity-1',
      confidence: 'high',
      matchedBy: ['beacon', 'localName'],
    });
  });

  it('classifies mac-only matches as platform specific', () => {
    const scan: BleScanResult = {
      ...baseScan,
      macAddress: 'AA:BB:CC:DD:EE:FF',
      localName: undefined,
    };

    const registeredTags: RegisteredTag[] = [
      {
        entityId: 'android-only',
        fingerprint: buildFingerprint(scan, { id: 'tag-android', createdAt: scan.seenAt }),
      },
    ];

    expect(matchPresence(scan, registeredTags)).toMatchObject({
      entityId: 'android-only',
      confidence: 'platform_specific',
      matchedBy: ['macAddress'],
    });
  });

  it('does not match by local name alone with the default threshold', () => {
    const registeredTags: RegisteredTag[] = [
      {
        entityId: 'weak-match',
        fingerprint: buildFingerprint(baseScan, { id: 'tag-weak', createdAt: baseScan.seenAt }),
      },
    ];

    expect(matchPresence(baseScan, registeredTags)).toBeNull();
  });
});

