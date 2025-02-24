import React, {createContext, useContext, useEffect, useState} from 'react';
import {AppState, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

import {Location} from './types.ts';

const locationPermission =
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

const requestLocationPermission = async () => {
  let permissionResult = await check(locationPermission);
  if (permissionResult === RESULTS.DENIED) {
    permissionResult = await request(locationPermission);
  }
  return permissionResult === RESULTS.GRANTED;
};

export const getUserLocation = async (): Promise<Location> => {
  const hasPermission = await requestLocationPermission();
  return new Promise((resolve, reject) => {
    if (!hasPermission) {
      return reject(new Error('Location permission not granted'));
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        resolve({latitude, longitude});
      },
      error => reject(error),
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  });
};

const LocationContext: React.Context<any> = createContext(null);
export const useLocation = () => useContext(LocationContext);

const fiveMinutes = 5 * 60 * 1000;

const fetchLocation = async (
  setLocation: (location: Location) => void,
  setLastFetchTime: (time: number) => void,
  setError: (error: boolean) => void,
) => {
  if (AppState.currentState !== 'active') {
    return;
  }
  try {
    setError(false);
    const userLocation = await getUserLocation();
    setLocation(userLocation);
    setLastFetchTime(Date.now());
  } catch (error_) {
    console.error('Error fetching location', error_);
    setError(true);
  }
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider = ({children}: LocationProviderProps) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const fetchLocationExport = async () =>
    await fetchLocation(setLocation, setLastFetchTime, setError);

  useEffect(() => {
    const fetchLocationInternal = async () => {
      if (shouldFetchLocation()) {
        await fetchLocation(setLocation, setLastFetchTime, setError);
      }
    };

    const shouldFetchLocation = () => {
      if (!lastFetchTime) {
        return true;
      }
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      return timeSinceLastFetch >= fiveMinutes;
    };

    fetchLocationInternal().catch(error_ => console.error(error_));
    const intervalId = setInterval(fetchLocationInternal, fiveMinutes);

    const onAppStateChange = async () => {
      const permissionResult = await check(locationPermission);
      if (permissionResult === RESULTS.GRANTED || Platform.OS === 'ios') {
        await fetchLocationInternal();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [lastFetchTime]);

  return (
    <LocationContext.Provider
      value={{
        location,
        locationError: error,
        fetchLocation: fetchLocationExport,
      }}>
      {children}
    </LocationContext.Provider>
  );
};
