export type BlePlatform = 'android' | 'ios' | 'unknown';

export type BeaconPayload =
  | {
      type: 'ibeacon';
      uuid: string;
      major: number;
      minor: number;
    }
  | {
      type: 'eddystone_uid';
      namespace: string;
      instance: string;
    };

export type BleScanResult = {
  id: string;
  platform: BlePlatform;
  rssi: number | null;
  localName?: string;
  macAddress?: string;
  peripheralId?: string;
  manufacturerData?: string;
  serviceData?: Record<string, string>;
  serviceUuids?: string[];
  beacon?: BeaconPayload;
  seenAt: string;
};

export type BleFingerprint = {
  id: string;
  platform: BlePlatform;
  localName?: string;
  macAddress?: string;
  peripheralId?: string;
  manufacturerData?: string;
  serviceData?: Record<string, string>;
  serviceUuids: string[];
  beacon?: BeaconPayload;
  quality: FingerprintQuality;
  createdAt: string;
};

export type FingerprintQuality = 'high' | 'medium' | 'low' | 'platform_specific' | 'none';

export type RegisteredTag<TEntityId extends string = string> = {
  entityId: TEntityId;
  fingerprint: BleFingerprint;
  metadata?: Record<string, unknown>;
};

export type MatchConfidence = 'high' | 'medium' | 'low' | 'platform_specific' | 'none';

export type PresenceMatch<TEntityId extends string = string> = {
  entityId: TEntityId;
  confidence: MatchConfidence;
  score: number;
  matchedBy: string[];
  fingerprint: BleFingerprint;
};

export type MatchingStrategy = {
  minScore: number;
  weights: {
    beacon: number;
    manufacturerData: number;
    serviceData: number;
    serviceUuids: number;
    localName: number;
    macAddress: number;
    peripheralId: number;
  };
};

