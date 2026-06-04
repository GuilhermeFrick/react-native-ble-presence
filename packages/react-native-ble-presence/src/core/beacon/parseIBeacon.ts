import type { BeaconPayload } from '../../types';

const IBEACON_PREFIX = '4c000215';
const IBEACON_MIN_HEX_LENGTH = 50;

export function parseIBeacon(manufacturerData: string | undefined): BeaconPayload | undefined {
  if (!manufacturerData || manufacturerData.length < IBEACON_MIN_HEX_LENGTH) {
    return undefined;
  }

  const normalized = manufacturerData.toLowerCase();

  if (!normalized.startsWith(IBEACON_PREFIX)) {
    return undefined;
  }

  const uuidHex = normalized.slice(8, 40);
  const majorHex = normalized.slice(40, 44);
  const minorHex = normalized.slice(44, 48);

  return {
    type: 'ibeacon',
    uuid: formatUuid(uuidHex),
    major: Number.parseInt(majorHex, 16),
    minor: Number.parseInt(minorHex, 16),
  };
}

function formatUuid(value: string): string {
  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join('-');
}

