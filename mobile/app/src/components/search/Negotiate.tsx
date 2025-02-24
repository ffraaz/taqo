import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Button, Text} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider.tsx';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import useSpotSubscription from '../../utils/useSpotSubscription.ts';
import {
  isAvailable,
  isValidSellerPrice,
  request,
  requestPushPermission,
  toNumber,
} from '../../utils/Utils.ts';
import DismissButton from '../commons/DismissButton.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import SpotCard from '../commons/SpotCard.tsx';
import Price from '../offer/Price.tsx';

const Negotiate = ({navigation, route}: RootStackScreenProps<'Negotiate'>) => {
  const {spotId, setPriceSuggestedBannerVisible} = route.params;
  const spot = useSpotSubscription(spotId);
  const [price, setPrice] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const {user} = useAuth();

  useEffect(() => {
    if (!user || !isAvailable(spot)) {
      navigation.goBack();
    }
  }, [navigation, spot, user]);

  const suggestPrice = async () => {
    if (!spot) {
      return;
    }
    if (toNumber(price) < 2) {
      Alert.alert('Invalid price', 'Please enter a price of at least 2 €.');
      return;
    }
    if (toNumber(price) >= spot.buyerPrice) {
      Alert.alert(
        'Invalid price',
        'Please enter a price that is lower than the current price.',
      );
      return;
    }
    setIsUpdating(true);
    try {
      await request(
        'suggest_price',
        {spotId: spot.id, buyerPrice: toNumber(price)},
        user,
      );
      navigation.goBack();
      setPriceSuggestedBannerVisible(true);
      await requestPushPermission();
    } catch (error) {
      setIsUpdating(false);
      Alert.alert('Error', 'Failed to suggest price. Please try again later.');
      console.error('Error suggesting a price:', error);
    }
  };

  if (spot) {
    return (
      <ScreenWrapper style={globalStyles.flex}>
        <View style={globalStyles.row}>
          <DismissButton
            onPress={() => navigation.goBack()}
            disabled={isUpdating}
          />
          <Button
            mode="contained"
            onPress={suggestPrice}
            style={[globalStyles.denseButton, globalStyles.topRightButton]}
            loading={isUpdating}
            disabled={!isValidSellerPrice(price) || isUpdating}>
            Done
          </Button>
        </View>
        <KeyboardAwareScrollView keyboardOpeningTime={Number.MAX_SAFE_INTEGER}>
          <View style={[globalStyles.marginHorizontal, styles.container]}>
            <SpotCard spot={spot} style={styles.spotCard} />
            <Text style={styles.headerText}>Suggest a new price</Text>
            <Price price={price} setPrice={setPrice} />
          </View>
        </KeyboardAwareScrollView>
      </ScreenWrapper>
    );
  } else {
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerText: {
    fontSize: 22,
    marginBottom: 40,
  },
  spotCard: {
    marginBottom: 40,
  },
});

export default Negotiate;
