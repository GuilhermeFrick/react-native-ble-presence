import { useBlePresence } from './useBlePresence';
import type { BleScannerOptions } from '../../types';

export function useBleScanner() {
  const { clearNearbyTags, startScan, state, stopScan } = useBlePresence();

  return {
    clearNearbyTags,
    error: state.error,
    isScanning: state.scannerStatus === 'scanning',
    nearbyTags: state.nearbyTags,
    scannerStatus: state.scannerStatus,
    startScan: (options?: BleScannerOptions) => startScan(options),
    stopScan,
  };
}

