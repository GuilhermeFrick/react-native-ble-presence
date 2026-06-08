import type {
  BackgroundBleMonitor,
  BackgroundBleMonitorListener,
  BackgroundBleMonitorOptions,
} from '../../types';

export function noopBackgroundBleMonitor(): BackgroundBleMonitor {
  return {
    async isAvailable() {
      return false;
    },
    async start(_options: BackgroundBleMonitorOptions) {},
    async stop() {},
    async getPendingEvents() {
      return [];
    },
    subscribe(_listener: BackgroundBleMonitorListener) {
      return () => {};
    },
  };
}
