import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  PaymentSheetError,
  PlatformPayError,
  StripeError,
} from '@stripe/stripe-react-native';

import {BookingError} from './Utils';

export type RootStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabsParamList>;
  LoginFlow: {targetScreen: string};
  SoldSpot: undefined;
  SpotDeletedDueToIssue: undefined;
  Locate: {
    spotId: string;
    setIssueReportedBannerVisible: (visible: boolean) => void;
  };
  Negotiate: {
    spotId: string;
    setPriceSuggestedBannerVisible: (visible: boolean) => void;
  };
  RespondToSuggestedPrice: {
    spotId: string;
    sellerPrice: number;
    setPriceReductionAcceptedBannerVisible: (visible: boolean) => void;
  };
  BookSpot: {
    spotId: string;
    setSelectedSpotId: (spotId: string | null) => void;
  };
  BookWithPayPal: {
    spotId: string;
    transactionId: string;
    user: FirebaseAuthTypes.User;
    setSuccessState: () => void;
    stopBookingProcess: StopBookingProcess;
  };
  Edit: {spot: Spot; setUpdatedBannerVisible: (visible: boolean) => void};
  Contact: undefined;
  TransactionSuccess: {spotId: string};
  Transactions: undefined;
};

export type BottomTabsParamList = {
  Search: undefined;
  Offer: undefined;
  Profile: undefined;
};

export type CreateOfferStackParamList = {
  SelectQueue: undefined;
  SelectProgress: undefined;
  SelectPrice: undefined;
  ExplainSelfie: undefined;
  TakeSelfie: undefined;
  PayPalForm: undefined;
  Summary: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type BottomTabsScreenProps<T extends keyof BottomTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabsParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type CreateOfferStackScreenProps<
  T extends keyof CreateOfferStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<CreateOfferStackParamList, T>,
  BottomTabsScreenProps<keyof BottomTabsParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Spot {
  queueName: string;
  distance: number;
  progress: number;
  sellerPrice: number;
  buyerPrice: number;
  id: string;
  downloadUrl: string;
  status: string;
  sellerId: string;
  location: Location;
}

export interface Transaction {
  buyerId: string;
  buyerPrice: number;
  sellerPrice: number;
  queueName: string;
  createdAt: any;
  spotId: string;
  id: string;
}

export type StripePaymentError =
  | StripeError<PlatformPayError>
  | StripeError<PaymentSheetError>;

export type StopBookingProcess = (
  error: StripePaymentError | BookingError,
  shouldFreeSpot?: boolean,
) => Promise<void | never>;
