import type { BlePlatform, BleScanResult } from '../../types';

export type BlePlxDeviceLike = {
  id: string;
  name?: string | null;
  localName?: string | null;
  rssi?: number | null;
  manufacturerData?: string | null;
  serviceData?: Record<string, string> | null;
  serviceUUIDs?: string[] | null;
};

export type NormalizeBlePlxDeviceOptions = {
  platform: BlePlatform;
  seenAt: string;
};

export function normalizeBlePlxDevice(
  device: BlePlxDeviceLike,
  options: NormalizeBlePlxDeviceOptions,
): BleScanResult {
  const localName = device.localName ?? device.name ?? undefined;

  return {
    id: device.id,
    platform: options.platform,
    rssi: device.rssi ?? null,
    localName,
    macAddress: options.platform === 'android' ? device.id : undefined,
    peripheralId: options.platform === 'ios' ? device.id : undefined,
    manufacturerData: normalizeNullable(device.manufacturerData),
    serviceData: normalizeServiceData(device.serviceData),
    serviceUuids: normalizeServiceUuids(device.serviceUUIDs),
    seenAt: options.seenAt,
  };
}

function normalizeNullable(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function normalizeServiceUuids(serviceUuids: string[] | null | undefined): string[] | undefined {
  if (!serviceUuids || serviceUuids.length === 0) {
    return undefined;
  }

  return [...new Set(serviceUuids.map((serviceUuid) => serviceUuid.toLowerCase()))].sort();
}

function normalizeServiceData(serviceData: Record<string, string> | null | undefined): Record<string, string> | undefined {
  if (!serviceData || Object.keys(serviceData).length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(serviceData)
      .map(([serviceUuid, data]) => [serviceUuid.toLowerCase(), data] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

