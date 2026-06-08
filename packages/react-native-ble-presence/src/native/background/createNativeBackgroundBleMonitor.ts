import { NativeEventEmitter, NativeModules } from 'react-native';
import type {
  BackgroundBleMonitor,
  BackgroundBleMonitorEvent,
  BackgroundBleMonitorListener,
  BackgroundBleMonitorOptions,
} from '../../types';
import { noopBackgroundBleMonitor } from './noopBackgroundBleMonitor';

const eventName = 'BlePresenceBackgroundEvent';

type NativeBackgroundBleMonitorModule = {
  isAvailable(): Promise<boolean>;
  startMonitoring(options: BackgroundBleMonitorOptions): Promise<void>;
  stopMonitoring(): Promise<void>;
  getPendingEvents(): Promise<BackgroundBleMonitorEvent[]>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
};

export function createNativeBackgroundBleMonitor(): BackgroundBleMonitor {
  const nativeModule = NativeModules.BlePresenceBackgroundMonitor as
    | NativeBackgroundBleMonitorModule
    | undefined;

  if (!nativeModule) {
    return noopBackgroundBleMonitor();
  }

  const eventEmitter = new NativeEventEmitter(nativeModule);

  return {
    isAvailable: () => nativeModule.isAvailable(),
    start: (options: BackgroundBleMonitorOptions) => nativeModule.startMonitoring(options),
    stop: () => nativeModule.stopMonitoring(),
    getPendingEvents: () => nativeModule.getPendingEvents(),
    subscribe(listener: BackgroundBleMonitorListener) {
      const subscription = eventEmitter.addListener(eventName, listener);
      return () => subscription.remove();
    },
  };
}
