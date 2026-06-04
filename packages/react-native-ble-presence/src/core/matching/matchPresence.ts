import type {
  BleFingerprint,
  BleScanResult,
  MatchConfidence,
  MatchingStrategy,
  PresenceMatch,
  RegisteredTag,
} from '../../types';
import { buildFingerprint } from '../fingerprint/buildFingerprint';
import { defaultMatchingStrategy } from './defaultMatchingStrategy';

export type MatchPresenceOptions = {
  strategy?: MatchingStrategy;
};

type CandidateMatch<TEntityId extends string> = PresenceMatch<TEntityId> | null;

export function matchPresence<TEntityId extends string = string>(
  scanResult: BleScanResult,
  registeredTags: RegisteredTag<TEntityId>[],
  options: MatchPresenceOptions = {},
): PresenceMatch<TEntityId> | null {
  const strategy = options.strategy ?? defaultMatchingStrategy;
  const detectedFingerprint = buildFingerprint(scanResult);

  const matches = registeredTags
    .map((registeredTag) => matchRegisteredTag(detectedFingerprint, registeredTag, strategy))
    .filter((match): match is PresenceMatch<TEntityId> => Boolean(match))
    .sort((left, right) => right.score - left.score);

  return matches[0] ?? null;
}

function matchRegisteredTag<TEntityId extends string>(
  detected: BleFingerprint,
  registeredTag: RegisteredTag<TEntityId>,
  strategy: MatchingStrategy,
): CandidateMatch<TEntityId> {
  const matchedBy: string[] = [];
  let score = 0;

  if (sameBeacon(detected, registeredTag.fingerprint)) {
    score += strategy.weights.beacon;
    matchedBy.push('beacon');
  }

  if (sameValue(detected.manufacturerData, registeredTag.fingerprint.manufacturerData)) {
    score += strategy.weights.manufacturerData;
    matchedBy.push('manufacturerData');
  }

  if (sameServiceData(detected.serviceData, registeredTag.fingerprint.serviceData)) {
    score += strategy.weights.serviceData;
    matchedBy.push('serviceData');
  }

  if (hasServiceUuidOverlap(detected.serviceUuids, registeredTag.fingerprint.serviceUuids)) {
    score += strategy.weights.serviceUuids;
    matchedBy.push('serviceUuids');
  }

  if (sameValue(detected.localName, registeredTag.fingerprint.localName)) {
    score += strategy.weights.localName;
    matchedBy.push('localName');
  }

  if (sameValue(detected.macAddress, registeredTag.fingerprint.macAddress)) {
    score += strategy.weights.macAddress;
    matchedBy.push('macAddress');
  }

  if (sameValue(detected.peripheralId, registeredTag.fingerprint.peripheralId)) {
    score += strategy.weights.peripheralId;
    matchedBy.push('peripheralId');
  }

  if (score < strategy.minScore) {
    return null;
  }

  return {
    entityId: registeredTag.entityId,
    confidence: calculateConfidence(score, matchedBy),
    score,
    matchedBy,
    fingerprint: registeredTag.fingerprint,
  };
}

function calculateConfidence(score: number, matchedBy: string[]): MatchConfidence {
  if (matchedBy.includes('macAddress') || matchedBy.includes('peripheralId')) {
    const strongCrossPlatformMatch = matchedBy.some((field) =>
      ['beacon', 'manufacturerData', 'serviceData'].includes(field),
    );

    if (!strongCrossPlatformMatch) {
      return 'platform_specific';
    }
  }

  if (score >= 80) {
    return 'high';
  }

  if (score >= 50) {
    return 'medium';
  }

  if (score > 0) {
    return 'low';
  }

  return 'none';
}

function sameBeacon(left: BleFingerprint, right: BleFingerprint): boolean {
  if (!left.beacon || !right.beacon || left.beacon.type !== right.beacon.type) {
    return false;
  }

  if (left.beacon.type === 'ibeacon' && right.beacon.type === 'ibeacon') {
    return (
      left.beacon.uuid.toLowerCase() === right.beacon.uuid.toLowerCase() &&
      left.beacon.major === right.beacon.major &&
      left.beacon.minor === right.beacon.minor
    );
  }

  if (left.beacon.type === 'eddystone_uid' && right.beacon.type === 'eddystone_uid') {
    return (
      left.beacon.namespace.toLowerCase() === right.beacon.namespace.toLowerCase() &&
      left.beacon.instance.toLowerCase() === right.beacon.instance.toLowerCase()
    );
  }

  return false;
}

function sameValue(left: string | undefined, right: string | undefined): boolean {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function sameServiceData(
  left: Record<string, string> | undefined,
  right: Record<string, string> | undefined,
): boolean {
  if (!left || !right) {
    return false;
  }

  return Object.entries(left).some(([serviceUuid, value]) => sameValue(value, right[serviceUuid]));
}

function hasServiceUuidOverlap(left: string[], right: string[]): boolean {
  const rightSet = new Set(right.map((uuid) => uuid.toLowerCase()));
  return left.some((uuid) => rightSet.has(uuid.toLowerCase()));
}

