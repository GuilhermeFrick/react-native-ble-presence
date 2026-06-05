import React, { useMemo } from 'react';
import {
  BlePresenceProvider,
  createBlePlxScanner,
  createReactNativeBlePermissionManager,
} from '@guilhermefrick/react-native-ble-presence';
import { DemoScreen } from './src/DemoScreen';
import { createMemoryBlePresenceAdapter } from './src/mocks/createMemoryBlePresenceAdapter';

export default function App() {
  const adapter = useMemo(() => createMemoryBlePresenceAdapter(), []);
  const permissionManager = useMemo(() => createReactNativeBlePermissionManager(), []);
  const scanner = useMemo(() => createBlePlxScanner(), []);

  return (
    <BlePresenceProvider adapter={adapter} permissionManager={permissionManager} scanner={scanner}>
      <DemoScreen />
    </BlePresenceProvider>
  );
}
