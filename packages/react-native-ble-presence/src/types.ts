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

export type BleScannerStatus = 'idle' | 'scanning' | 'stopped' | 'error';

export type BlePermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'requires_system_action' | 'unknown';

export type BleScannerOptions = {
  minRssi?: number;
  allowDuplicates?: boolean;
};

export type BleScannerListener = (scanResult: BleScanResult) => void;

export type BleScanner = {
  startScan(options?: BleScannerOptions): Promise<void>;
  stopScan(): Promise<void>;
  subscribe(listener: BleScannerListener): () => void;
};

export type BackgroundBleMonitorFilter =
  | {
      id: string;
      type: 'ibeacon';
      uuid: string;
      major?: number;
      minor?: number;
    }
  | {
      id: string;
      type: 'service_uuid';
      serviceUuid: string;
    };

export type BackgroundBleMonitorOptions = {
  filters: BackgroundBleMonitorFilter[];
};

export type BackgroundBleMonitorEventType = 'entered' | 'exited' | 'discovered' | 'error';

export type BackgroundBleMonitorEvent = {
  id: string;
  type: BackgroundBleMonitorEventType;
  filterId?: string;
  platform: BlePlatform;
  occurredAt: string;
  scanResult?: BleScanResult;
  message?: string;
};

export type BackgroundBleMonitorListener = (event: BackgroundBleMonitorEvent) => void;

export type BackgroundBleMonitor = {
  isAvailable(): Promise<boolean>;
  start(options: BackgroundBleMonitorOptions): Promise<void>;
  stop(): Promise<void>;
  getPendingEvents(): Promise<BackgroundBleMonitorEvent[]>;
  subscribe(listener: BackgroundBleMonitorListener): () => void;
};

export type BlePermissionManager = {
  checkPermissions(): Promise<BlePermissionStatus>;
  requestPermissions(): Promise<BlePermissionStatus>;
};

export type SaveTagRegistrationInput<TEntityId extends string = string> = {
  entityId: TEntityId;
  fingerprint: BleFingerprint;
};

export type PresenceEventType = 'matched' | 'lost';

export type PresenceEvent<TEntityId extends string = string> = {
  type: PresenceEventType;
  entityId: TEntityId;
  match?: PresenceMatch<TEntityId>;
  occurredAt: string;
};

export type BlePresenceAdapter<TEntityId extends string = string> = {
  getRegisteredTags(): Promise<RegisteredTag<TEntityId>[]>;
  saveTagRegistration(input: SaveTagRegistrationInput<TEntityId>): Promise<RegisteredTag<TEntityId>>;
  reportPresenceEvent?(event: PresenceEvent<TEntityId>): Promise<void>;
};

export type BlePresenceConfig = {
  scanner?: BleScannerOptions;
  matchingStrategy?: MatchingStrategy;
  clock?: () => string;
};

export type TagRegistrationResult<TEntityId extends string = string> = {
  registeredTag: RegisteredTag<TEntityId>;
  quality: FingerprintQuality;
};

export type BlePresenceState<TEntityId extends string = string> = {
  permissionStatus: BlePermissionStatus;
  scannerStatus: BleScannerStatus;
  nearbyTags: BleScanResult[];
  registeredTags: RegisteredTag<TEntityId>[];
  currentMatch: PresenceMatch<TEntityId> | null;
  error: Error | null;
};
