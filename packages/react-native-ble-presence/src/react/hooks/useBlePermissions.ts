import { useBlePresence } from './useBlePresence';

export function useBlePermissions() {
  const { checkPermissions, requestPermissions, state } = useBlePresence();

  return {
    checkPermissions,
    permissionStatus: state.permissionStatus,
    requestPermissions,
  };
}

