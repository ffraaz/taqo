import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import axios, {AxiosError} from 'axios';
import {Platform} from 'react-native';
import {
  PERMISSIONS,
  request as requestPermission,
} from 'react-native-permissions';

import {config} from './Config';
import {Location, Spot} from './types.ts';

export const request = async (
  method: string,
  data: object,
  user: FirebaseAuthTypes.User,
) => {
  const url = get_url(method);
  const token = await user.getIdToken();
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  try {
    const response = await axios.post(url, data, {headers});
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.data) {
      throw Error(axiosError.response.data as string);
    } else {
      throw error;
    }
  }
};

function get_url(method: string) {
  if (config.remoteBackend) {
    const method_name = method.replace(/_/g, '-');
    return config.baseUrl.replace('method_name', method_name);
  } else {
    return `${config.baseUrl}/${method}`;
  }
}

export const formatPrice = (
  price: number,
  locale = 'de-DE',
  currency = 'EUR',
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
};

export const saveUserDetails = async (
  user: FirebaseAuthTypes.User | null | undefined,
  dataToUpdate: object,
) => {
  if (!user) {
    return;
  }
  const userId = user.uid;
  await firestore()
    .collection('users')
    .doc(userId)
    .set(dataToUpdate, {merge: true});
};

export const spotFromDoc = (
  doc: FirebaseFirestoreTypes.DocumentSnapshot,
  location: Location,
) => {
  const rawSpot = {id: doc.id, ...doc.data()} as Spot;
  return addDistance(rawSpot, location);
};

export const addDistance = (spot: Spot, userLocation: Location) => {
  return {
    ...spot,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      spot.location.latitude,
      spot.location.longitude,
    ),
  };
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const versionSmallerThan = (a: string, b: string) => {
  const [major_a, minor_a, patch_a] = a.split('.').map(Number);
  const [major_b, minor_b, patch_b] = b.split('.').map(Number);

  if (major_a < major_b) {
    return true;
  }
  if (major_a > major_b) {
    return false;
  }

  if (minor_a < minor_b) {
    return true;
  }
  if (minor_a > minor_b) {
    return false;
  }

  return patch_a < patch_b;
};

export function toNumber(price: string) {
  return parseInt(price, 10);
}

export function isValidSellerPrice(price: string) {
  return toNumber(price) >= 1;
}

export const requestPushPermission = async () => {
  if (Platform.OS === 'ios') {
    await messaging().requestPermission();
  } else {
    await requestPermission(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  }
};

export const isAvailable = (spot: Spot | null) => {
  return !spot || spot.status === 'available';
};

export class BookingError extends Error {
  public code: string;
  public isPaymentError: boolean;

  constructor(message: string, code: string, isPaymentError: boolean) {
    super(message);
    this.code = code;
    this.isPaymentError = isPaymentError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BookingError);
    }
  }
}
