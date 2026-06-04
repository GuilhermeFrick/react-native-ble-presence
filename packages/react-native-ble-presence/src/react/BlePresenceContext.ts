import { createContext } from 'react';
import type {
  BlePresenceAdapter,
  BlePresenceConfig,
  BlePresenceState,
  BlePermissionManager,
  BlePermissionStatus,
  BleScanResult,
  BleScanner,
  BleScannerOptions,
  RegisteredTag,
} from '../types';

export type BlePresenceContextValue<TEntityId extends string = string> = {
  adapter: BlePresenceAdapter<TEntityId>;
  config: BlePresenceConfig;
  permissionManager: BlePermissionManager;
  scanner: BleScanner;
  state: BlePresenceState<TEntityId>;
  checkPermissions(): Promise<BlePermissionStatus>;
  requestPermissions(): Promise<BlePermissionStatus>;
  startScan(options?: BleScannerOptions): Promise<void>;
  stopScan(): Promise<void>;
  clearNearbyTags(): void;
  setRegisteredTags(tags: RegisteredTag<TEntityId>[]): void;
  setCurrentMatch(match: BlePresenceState<TEntityId>['currentMatch']): void;
  setPermissionStatus(permissionStatus: BlePermissionStatus): void;
  pushScanResult(scanResult: BleScanResult): void;
};

export const BlePresenceContext = createContext<BlePresenceContextValue | null>(null);
