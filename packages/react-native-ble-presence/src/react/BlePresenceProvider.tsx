import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BlePresenceAdapter,
  BlePresenceConfig,
  BlePresenceState,
  BleScanResult,
  BleScanner,
  BleScannerOptions,
  RegisteredTag,
} from '../types';
import { createNoopBleScanner } from '../native/scanner/noopBleScanner';
import { BlePresenceContext, type BlePresenceContextValue } from './BlePresenceContext';

export type BlePresenceProviderProps<TEntityId extends string = string> = PropsWithChildren<{
  adapter: BlePresenceAdapter<TEntityId>;
  config?: BlePresenceConfig;
  scanner?: BleScanner;
}>;

export function BlePresenceProvider<TEntityId extends string = string>({
  adapter,
  children,
  config = {},
  scanner,
}: BlePresenceProviderProps<TEntityId>) {
  const resolvedScanner = useMemo(() => scanner ?? createNoopBleScanner(), [scanner]);
  const [state, setState] = useState<BlePresenceState<TEntityId>>({
    scannerStatus: 'idle',
    nearbyTags: [],
    registeredTags: [],
    currentMatch: null,
    error: null,
  });

  const pushScanResult = useCallback(
    (scanResult: BleScanResult) => {
      if (config.scanner?.minRssi !== undefined && scanResult.rssi !== null && scanResult.rssi < config.scanner.minRssi) {
        return;
      }

      setState((current) => ({
        ...current,
        nearbyTags: upsertScanResult(current.nearbyTags, scanResult),
      }));
    },
    [config.scanner?.minRssi],
  );

  useEffect(() => resolvedScanner.subscribe(pushScanResult), [pushScanResult, resolvedScanner]);

  const startScan = useCallback(
    async (options?: BleScannerOptions) => {
      try {
        setState((current) => ({ ...current, scannerStatus: 'scanning', error: null }));
        await resolvedScanner.startScan({ ...config.scanner, ...options });
      } catch (error) {
        setState((current) => ({ ...current, scannerStatus: 'error', error: toError(error) }));
        throw error;
      }
    },
    [config.scanner, resolvedScanner],
  );

  const stopScan = useCallback(async () => {
    try {
      await resolvedScanner.stopScan();
      setState((current) => ({ ...current, scannerStatus: 'stopped' }));
    } catch (error) {
      setState((current) => ({ ...current, scannerStatus: 'error', error: toError(error) }));
      throw error;
    }
  }, [resolvedScanner]);

  const clearNearbyTags = useCallback(() => {
    setState((current) => ({ ...current, nearbyTags: [] }));
  }, []);

  const setRegisteredTags = useCallback((registeredTags: RegisteredTag<TEntityId>[]) => {
    setState((current) => ({ ...current, registeredTags }));
  }, []);

  const setCurrentMatch = useCallback((currentMatch: BlePresenceState<TEntityId>['currentMatch']) => {
    setState((current) => ({ ...current, currentMatch }));
  }, []);

  const value = useMemo<BlePresenceContextValue<TEntityId>>(
    () => ({
      adapter,
      config,
      scanner: resolvedScanner,
      state,
      startScan,
      stopScan,
      clearNearbyTags,
      setRegisteredTags,
      setCurrentMatch,
      pushScanResult,
    }),
    [
      adapter,
      clearNearbyTags,
      config,
      pushScanResult,
      resolvedScanner,
      setCurrentMatch,
      setRegisteredTags,
      startScan,
      state,
      stopScan,
    ],
  );

  return <BlePresenceContext.Provider value={value}>{children}</BlePresenceContext.Provider>;
}

function upsertScanResult(scanResults: BleScanResult[], nextScanResult: BleScanResult): BleScanResult[] {
  const nextScanResults = scanResults.filter((scanResult) => scanResult.id !== nextScanResult.id);
  return [nextScanResult, ...nextScanResults].sort((left, right) => {
    const leftRssi = left.rssi ?? Number.NEGATIVE_INFINITY;
    const rightRssi = right.rssi ?? Number.NEGATIVE_INFINITY;
    return rightRssi - leftRssi;
  });
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

