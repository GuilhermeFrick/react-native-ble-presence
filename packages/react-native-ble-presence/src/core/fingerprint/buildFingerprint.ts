import type { BleFingerprint, BleScanResult, FingerprintQuality } from '../../types';

export type BuildFingerprintOptions = {
  id?: string;
  createdAt?: string;
};

export function buildFingerprint(
  scanResult: BleScanResult,
  options: BuildFingerprintOptions = {},
): BleFingerprint {
  const serviceUuids = normalizeServiceUuids(scanResult.serviceUuids);
  const fingerprint: BleFingerprint = {
    id: options.id ?? scanResult.id,
    platform: scanResult.platform,
    localName: scanResult.localName,
    macAddress: scanResult.macAddress,
    peripheralId: scanResult.peripheralId,
    manufacturerData: normalizeHex(scanResult.manufacturerData),
    serviceData: normalizeServiceData(scanResult.serviceData),
    serviceUuids,
    beacon: scanResult.beacon,
    quality: 'none',
    createdAt: options.createdAt ?? new Date().toISOString(),
  };

  fingerprint.quality = calculateFingerprintQuality(fingerprint);

  return fingerprint;
}

export function calculateFingerprintQuality(fingerprint: Omit<BleFingerprint, 'quality'>): FingerprintQuality {
  if (fingerprint.beacon || fingerprint.manufacturerData || hasServiceData(fingerprint.serviceData)) {
    return 'high';
  }

  if (fingerprint.serviceUuids.length > 0 && fingerprint.localName) {
    return 'medium';
  }

  if (fingerprint.macAddress || fingerprint.peripheralId) {
    return 'platform_specific';
  }

  if (fingerprint.localName || fingerprint.serviceUuids.length > 0) {
    return 'low';
  }

  return 'none';
}

function normalizeServiceUuids(serviceUuids: string[] | undefined): string[] {
  return [...new Set((serviceUuids ?? []).map((uuid) => uuid.toLowerCase()))].sort();
}

function normalizeServiceData(serviceData: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!serviceData || Object.keys(serviceData).length === 0) {
    return undefined;
  }

  const normalizedEntries: Array<[string, string]> = Object.entries(serviceData).map(([key, value]) => [
    key.toLowerCase(),
    normalizeRequiredHex(value),
  ]);

  return Object.fromEntries(normalizedEntries.sort(([left], [right]) => left.localeCompare(right)));
}

function normalizeHex(value: string | undefined): string | undefined {
  return value?.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
}

function normalizeRequiredHex(value: string): string {
  return value.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
}

function hasServiceData(serviceData: Record<string, string> | undefined): boolean {
  return Boolean(serviceData && Object.keys(serviceData).length > 0);
}
