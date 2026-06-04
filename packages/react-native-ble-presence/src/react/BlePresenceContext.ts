import { createContext } from 'react';
import type {
  BlePresenceAdapter,
  BlePresenceConfig,
  BlePresenceState,
  BleScanResult,
  BleScanner,
  BleScannerOptions,
  RegisteredTag,
} from '../types';

export type BlePresenceContextValue<TEntityId extends string = string> = {
  adapter: BlePresenceAdapter<TEntityId>;
  config: BlePresenceConfig;
  scanner: BleScanner;
  state: BlePresenceState<TEntityId>;
  startScan(options?: BleScannerOptions): Promise<void>;
  stopScan(): Promise<void>;
  clearNearbyTags(): void;
  setRegisteredTags(tags: RegisteredTag<TEntityId>[]): void;
  setCurrentMatch(match: BlePresenceState<TEntityId>['currentMatch']): void;
  pushScanResult(scanResult: BleScanResult): void;
};

export const BlePresenceContext = createContext<BlePresenceContextValue | null>(null);

