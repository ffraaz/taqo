import firestore from '@react-native-firebase/firestore';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {useNavigation} from '@react-navigation/native';
import {useEffect} from 'react';

import {useGlobalState} from './GlobalStateProvider.tsx';
import {toNumber} from './Utils.ts';

const useHandlePushNotification = () => {
  const navigation = useNavigation();
  const {
    setPriceReductionBannerVisible,
    setPriceReductionBannerText,
    setPriceReductionAcceptedBannerVisible,
  } = useGlobalState();

  useEffect(() => {
    const handleNotification = async (
      message: FirebaseMessagingTypes.RemoteMessage,
      context: string,
    ) => {
      console.log(`${context} push:`, message.data, message.messageId);
      const eventType = message.data?.type;
      if (eventType === 'sold_spot') {
        navigation.navigate('SoldSpot');
      } else if (eventType === 'spot_deleted_due_to_issue') {
        navigation.navigate('SpotDeletedDueToIssue');
      } else if (eventType === 'price_suggested') {
        await handlePriceSuggestion(message);
      } else if (eventType === 'price_reduction' && context === 'active') {
        setPriceReductionBannerVisible(true);
        setPriceReductionBannerText(message.data?.body);
      }
    };

    async function handlePriceSuggestion(
      message: FirebaseMessagingTypes.RemoteMessage,
    ) {
      const spotId = message.data?.spotId as string;
      const sellerPrice = toNumber(message.data?.sellerPrice as string);
      const spotDoc = await firestore().collection('spots').doc(spotId).get();
      if (spotDoc.data()?.status === 'available') {
        navigation.navigate('RespondToSuggestedPrice', {
          spotId,
          sellerPrice,
          setPriceReductionAcceptedBannerVisible,
        });
      }
    }

    (async function () {
      const message = await messaging().getInitialNotification();
      if (message) {
        await handleNotification(message, 'init');
      }
    })();

    const unsubscribeActive = messaging().onMessage(async message => {
      await handleNotification(message, 'active');
    });

    const unsubscribeOnTap = messaging().onNotificationOpenedApp(
      async message => {
        await handleNotification(message, 'ontap');
      },
    );

    return () => {
      unsubscribeActive();
      unsubscribeOnTap();
    };
  }, [
    navigation,
    setPriceReductionAcceptedBannerVisible,
    setPriceReductionBannerText,
    setPriceReductionBannerVisible,
  ]);
};

export default useHandlePushNotification;
