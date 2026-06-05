import React, { useMemo } from 'react';
import {
  BlePresenceProvider,
  createBlePlxScanner,
  createReactNativeBlePermissionManager,
} from '@guilhermefrick/react-native-ble-presence';
import { DemoScreen } from './src/DemoScreen';
import { createAsyncStorageBlePresenceAdapter } from './src/storage/createAsyncStorageBlePresenceAdapter';

export default function App() {
  const adapter = useMemo(() => createAsyncStorageBlePresenceAdapter(), []);
  const permissionManager = useMemo(() => createReactNativeBlePermissionManager(), []);
  const scanner = useMemo(() => createBlePlxScanner(), []);

  return (
    <BlePresenceProvider adapter={adapter} permissionManager={permissionManager} scanner={scanner}>
      <DemoScreen />
    </BlePresenceProvider>
  );
}
