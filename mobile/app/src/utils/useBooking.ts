import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  confirmPlatformPayPayment,
  PlatformPay,
  useStripe,
} from '@stripe/stripe-react-native';
import {Alert} from 'react-native';

import {useAuth} from './AuthProvider.tsx';
import {config} from './Config.ts';
import {StripePaymentError} from './types.ts';
import {BookingError, request} from './Utils.ts';

const useBooking = (
  spotId: string,
  buyerPrice: number,
  setIsBooking: (isBooking: boolean) => void,
  setIsLoading: (isLoading: boolean) => void,
  setSelectedSpotId: (spotId: string | null) => void,
  setBookingSuccess: (bookingSuccess: boolean) => void,
) => {
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const {user} = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const bookWithPlatformPay = async () => {
    initBookingProcess();
    await tryToReserveSpot();
    const {paymentIntentClientSecret, transactionId} =
      await tryToFetchPaymentSheetParams();
    setIsLoading(false);
    const {error} = await presentPlatformPay(paymentIntentClientSecret);
    await finalize(error, transactionId);
  };

  const bookWithCreditCard = async () => {
    initBookingProcess();
    await tryToReserveSpot();
    const transactionId = await tryToInitializePaymentSheet();
    setIsLoading(false);
    const {error} = await presentPaymentSheet();
    await finalize(error, transactionId);
  };

  const bookWithPayPal = async () => {
    initBookingProcess();
    await tryToReserveSpot();
    const transactionId = await tryToCreateTransaction();
    setIsLoading(false);
    navigation.navigate('BookWithPayPal', {
      spotId,
      transactionId,
      user,
      setSuccessState,
      stopBookingProcess,
    });
  };

  const initBookingProcess = () => {
    setIsBooking(true);
    setIsLoading(true);
  };

  const tryToReserveSpot = async () => {
    try {
      await request('reserve_spot', {spotId}, user);
    } catch (error) {
      const bookingError = new BookingError(
        (error as Error).message,
        'reserve_spot',
        false,
      );
      await stopBookingProcess(bookingError, false);
    }
  };

  const finalize = async (
    error: StripePaymentError | undefined,
    transactionId: string,
  ) => {
    if (error) {
      await stopBookingProcess(error);
    } else {
      await handlePaymentSuccess(transactionId);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      setIsLoading(true);
      await request(
        'stripe_book_spot',
        {
          spotId,
          transactionId,
        },
        user,
      );
      setSuccessState();
    } catch (error) {
      setIsLoading(false);
      setIsBooking(false);
      Alert.alert(
        'Error',
        'Failed to book spot. Your payment method has already been charged. We will refund you shortly.',
      );
    }
  };

  const setSuccessState = () => {
    setBookingSuccess(true);
    setSelectedSpotId(null);
    setIsLoading(false);
  };

  const stopBookingProcess = async (
    error: StripePaymentError | BookingError,
    shouldFreeSpot = true,
  ) => {
    if (shouldFreeSpot) {
      setIsLoading(true);
      await freeSpot();
    }
    const errorMessage = getErrorMessage(error);
    setTimeout(() => {
      setIsLoading(false);
      setIsBooking(false);
      if (error.code !== 'Canceled') {
        Alert.alert('Error', errorMessage);
      }
    }, 100);
    if (!isPaymentError(error)) {
      throw Error(errorMessage);
    }
  };

  const freeSpot = async () => {
    try {
      await request('free_spot', {spotId}, user);
    } catch (error) {
      console.error('Error freeing spot: ', error);
    }
  };

  function getErrorMessage(error: StripePaymentError | BookingError) {
    if (isPaymentError(error)) {
      return 'There was an error processing your payment. Please try again later.';
    } else if (error.message === 'ff_error/spot_unavailable/charged') {
      return 'Failed to book spot. Your payment method has already been charged. We will refund you shortly.';
    } else {
      return 'Failed to book spot. Please try again later.';
    }
  }

  function isPaymentError(error: StripePaymentError | BookingError) {
    if (error instanceof BookingError) {
      return error.isPaymentError;
    } else {
      return true;
    }
  }

  const presentPlatformPay = async (paymentIntentClientSecret: string) => {
    return await confirmPlatformPayPayment(paymentIntentClientSecret, {
      applePay: {
        cartItems: [
          {
            label: 'Taqo',
            amount: buyerPrice.toString(),
            paymentType: PlatformPay.PaymentType.Immediate,
          },
        ],
        merchantCountryCode: 'US',
        currencyCode: 'EUR',
      },
      googlePay: {
        testEnv: config.googlePayTestEnv,
        merchantName: 'Taqo',
        merchantCountryCode: 'US',
        currencyCode: 'EUR',
      },
    });
  };

  const tryToCreateTransaction = async () => {
    try {
      const {transactionId} = await request(
        'paypal_create_transaction',
        {
          spotId,
        },
        user,
      );
      return transactionId;
    } catch (error) {
      const bookingError = new BookingError(
        (error as Error).message,
        'create_transaction',
        false,
      );
      await stopBookingProcess(bookingError);
    }
  };

  const tryToInitializePaymentSheet = async () => {
    const appearance = {
      colors: {
        primary: '#000000',
      },
    };
    const {paymentIntentClientSecret, transactionId, ephemeralKey, customer} =
      await tryToFetchPaymentSheetParams();
    const {error} = await initPaymentSheet({
      merchantDisplayName: 'Taqo',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret,
      appearance,
    });
    if (error) {
      const bookingError = new BookingError(
        error.message,
        'init_payment_sheet',
        false,
      );
      await stopBookingProcess(bookingError);
    } else {
      return transactionId;
    }
  };

  const tryToFetchPaymentSheetParams = async (): Promise<any> => {
    try {
      return await request(
        'stripe_payment_sheet',
        {
          spotId,
        },
        user,
      );
    } catch (error) {
      const bookingError = new BookingError(
        (error as Error).message,
        'fetch_payment_sheet_params',
        false,
      );
      await stopBookingProcess(bookingError);
    }
  };

  return {bookWithPayPal, bookWithCreditCard, bookWithPlatformPay};
};

export default useBooking;
