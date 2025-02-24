import React, {useEffect, useRef} from 'react';
import {WebView, WebViewMessageEvent} from 'react-native-webview';

import {config} from '../../utils/Config';
import {useGlobalState} from '../../utils/GlobalStateProvider.tsx';
import globalStyles from '../../utils/styles.ts';
import {RootStackScreenProps} from '../../utils/types.ts';
import {BookingError} from '../../utils/Utils.ts';
import DismissButton from '../commons/DismissButton.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';

const BookWithPayPal = ({
  navigation,
  route,
}: RootStackScreenProps<'BookWithPayPal'>) => {
  const {spotId, transactionId, user, setSuccessState, stopBookingProcess} =
    route.params;
  const webViewRef = useRef<WebView>(null);
  const userCancelledRef = useRef(true);
  const {
    payPalSheetDismissable: dismissable,
    setPayPalSheetDismissable: setDismissable,
  } = useGlobalState();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async _event => {
      if (userCancelledRef.current) {
        const bookingError = new BookingError(
          'Booking process canceled',
          'Canceled',
          true,
        );
        await stopBookingProcess(bookingError);
      }
    });
    return () => unsubscribe();
  }, [navigation, stopBookingProcess]);

  const sendDataToWebView = async () => {
    if (webViewRef.current) {
      const idToken = await user.getIdToken();
      const message = JSON.stringify({data: {spotId, transactionId, idToken}});
      const event = `window.dispatchEvent(new MessageEvent('message', ${message}));`;
      webViewRef.current.injectJavaScript(event);
    }
  };

  function dismiss() {
    userCancelledRef.current = false;
    navigation.goBack();
    userCancelledRef.current = true;
  }

  const handleMessageFromWebView = async (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (data === 'ready') {
      await sendDataToWebView();
    } else if (data === 'approved') {
      setDismissable(false);
    } else if (data === 'success') {
      dismiss();
      setDismissable(true);
      setSuccessState();
    } else if (data.startsWith('ff_error/')) {
      dismiss();
      setDismissable(true);
      const isPaymentError = data === 'ff_error/payment_failed';
      const bookingError = new BookingError(
        data,
        'paypal_payment',
        isPaymentError,
      );
      await stopBookingProcess(bookingError);
    } else {
      console.log('Message from WebView:', data);
    }
  };

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <DismissButton
        onPress={() => navigation.goBack()}
        disabled={!dismissable}
      />
      <WebView
        ref={webViewRef}
        source={{uri: config.payPalUrl}}
        cacheEnabled={false}
        cacheMode={'LOAD_NO_CACHE'}
        incognito={true}
        onMessage={handleMessageFromWebView}
      />
    </ScreenWrapper>
  );
};

export default BookWithPayPal;
