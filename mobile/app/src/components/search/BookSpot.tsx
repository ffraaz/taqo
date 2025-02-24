import {
  isPlatformPaySupported,
  PlatformPay,
  PlatformPayButton,
} from '@stripe/stripe-react-native';
import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ActivityIndicator, Button} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import {useLocation} from '../../utils/LocationProvider';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import useBooking from '../../utils/useBooking.ts';
import useSpotSubscription from '../../utils/useSpotSubscription.ts';
import {isAvailable} from '../../utils/Utils.ts';
import BookingSuccess from '../commons/BookingSuccess';
import DismissButton from '../commons/DismissButton';
import {LocationError} from '../commons/PermissionError';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import SpotCard from '../commons/SpotCard';
import VerticallyCenteringView from '../commons/VerticallyCenteringView.tsx';
import SelectMethod from './SelectMethod';

const BookSpot = ({navigation, route}: RootStackScreenProps<'BookSpot'>) => {
  const {spotId, setSelectedSpotId} = route.params;
  const spot = useSpotSubscription(spotId);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const {user} = useAuth();
  const {locationError} = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('platform_pay');
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showForm = !bookingSuccess && !isLoading && !isBooking;
  const {bookWithPayPal, bookWithCreditCard, bookWithPlatformPay} = useBooking(
    spotId,
    spot ? spot.buyerPrice : 0,
    setIsBooking,
    setIsLoading,
    setSelectedSpotId,
    setBookingSuccess,
  );

  useEffect(() => {
    if (!user || (!isBooking && !isAvailable(spot))) {
      navigation.goBack();
    }
  }, [isBooking, navigation, spot, user]);

  useEffect(() => {
    (async function () {
      const isPlatformPayAvailable_ = await isPlatformPaySupported();
      setIsPlatformPayAvailable(isPlatformPayAvailable_);
      if (!isPlatformPayAvailable_) {
        setPaymentMethod('credit_card');
      }
      setIsLoading(false);
    })();
  }, [setIsPlatformPayAvailable, setIsLoading, setPaymentMethod]);

  if (locationError) {
    return <LocationError />;
  }

  if (user && spot) {
    return (
      <ScreenWrapper style={globalStyles.flex}>
        <DismissButton
          onPress={() => navigation.goBack()}
          disabled={isBooking && !bookingSuccess}
        />
        <View
          style={[
            globalStyles.flex,
            styles.container,
            globalStyles.marginHorizontal,
          ]}>
          <View>
            <SpotCard spot={spot} />
            {showForm && (
              <View style={styles.selectMethod}>
                <SelectMethod
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  isPlatformPayAvailable={isPlatformPayAvailable}
                />
              </View>
            )}
          </View>
          {isLoading && isBooking && (
            <VerticallyCenteringView>
              <ActivityIndicator />
            </VerticallyCenteringView>
          )}
          {showForm && (
            <View>
              {paymentMethod === 'paypal' && (
                <Button
                  mode="contained"
                  onPress={bookWithPayPal}
                  style={globalStyles.primaryButton}>
                  Book
                </Button>
              )}
              {paymentMethod === 'credit_card' && (
                <Button
                  mode="contained"
                  onPress={bookWithCreditCard}
                  style={globalStyles.primaryButton}>
                  Book
                </Button>
              )}
              {paymentMethod === 'platform_pay' && (
                <PlatformPayButton
                  type={PlatformPay.ButtonType.GooglePayMark}
                  onPress={bookWithPlatformPay}
                  borderRadius={10}
                  style={[globalStyles.primaryButton, styles.platformPayButton]}
                />
              )}
            </View>
          )}
          {bookingSuccess && <BookingSuccess downloadUrl={spot.downloadUrl} />}
        </View>
      </ScreenWrapper>
    );
  } else {
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    justifyContent: 'space-between',
  },
  selectMethod: {
    marginTop: 50,
  },
  platformPayButton: {
    height: 40,
  },
});

export default BookSpot;
