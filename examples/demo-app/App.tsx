import React, { useMemo } from 'react';
import { BlePresenceProvider } from '@guilhermefrick/react-native-ble-presence';
import { DemoScreen } from './src/DemoScreen';
import { createMemoryBlePresenceAdapter } from './src/mocks/createMemoryBlePresenceAdapter';
import { createMockBlePermissionManager } from './src/mocks/createMockBlePermissionManager';
import { createMockBleScanner } from './src/mocks/createMockBleScanner';

export default function App() {
  const adapter = useMemo(() => createMemoryBlePresenceAdapter(), []);
  const permissionManager = useMemo(() => createMockBlePermissionManager(), []);
  const scanner = useMemo(() => createMockBleScanner(), []);

  return (
    <BlePresenceProvider adapter={adapter} permissionManager={permissionManager} scanner={scanner}>
      <DemoScreen />
    </BlePresenceProvider>
  );
}

