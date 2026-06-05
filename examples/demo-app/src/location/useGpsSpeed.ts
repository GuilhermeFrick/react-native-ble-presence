import { useCallback, useRef, useState } from 'react';
import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export type GpsSpeedStatus = 'idle' | 'requesting' | 'watching' | 'denied' | 'error';

export type GpsSpeedState = {
  errorMessage: string | null;
  lastFixAt: string | null;
  speedKmh: number | null;
  status: GpsSpeedStatus;
};

const initialState: GpsSpeedState = {
  errorMessage: null,
  lastFixAt: null,
  speedKmh: null,
  status: 'idle',
};

export function useGpsSpeed() {
  const watchIdRef = useRef<number | null>(null);
  const [state, setState] = useState<GpsSpeedState>(initialState);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'idle',
    }));
  }, []);

  const start = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      errorMessage: null,
      status: 'requesting',
    }));

    const granted = await requestLocationPermission();

    if (!granted) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: 'Permissao de localizacao negada',
        status: 'denied',
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = Geolocation.watchPosition(handlePosition, handleError, {
      distanceFilter: 0,
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000,
    });

    setState((currentState) => ({
      ...currentState,
      status: 'watching',
    }));
  }, []);

  return {
    ...state,
    isWatching: state.status === 'watching',
    start,
    stop,
  };

  function handlePosition(position: GeolocationResponse) {
    const speedMetersPerSecond = position.coords.speed;
    const speedKmh =
      typeof speedMetersPerSecond === 'number'
        ? Math.max(0, speedMetersPerSecond * 3.6)
        : null;

    setState({
      errorMessage: null,
      lastFixAt: new Date(position.timestamp).toISOString(),
      speedKmh,
      status: 'watching',
    });
  }

  function handleError(error: GeolocationError) {
    setState((currentState) => ({
      ...currentState,
      errorMessage: error.message,
      status: 'error',
    }));
  }
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
