import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Button, Text} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import {useGlobalState} from '../../utils/GlobalStateProvider.tsx';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import {isValidSellerPrice, request, toNumber} from '../../utils/Utils';
import DismissButton from '../commons/DismissButton';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import Price from './Price';
import Progress from './Progress';

const EditOffer = ({navigation, route}: RootStackScreenProps<'Edit'>) => {
  const {spot, setUpdatedBannerVisible} = route.params;
  const [price, setPrice] = useState(spot.sellerPrice.toString());
  const [progress, setProgress] = useState(spot.progress);
  const [isUpdating, setIsUpdating] = useState(false);
  const {user} = useAuth();
  const {editable} = useGlobalState();

  useEffect(() => {
    if (!editable) {
      navigation.goBack();
    }
  }, [editable, navigation]);

  const updateSpot = async () => {
    setIsUpdating(true);
    try {
      await request(
        'update_spot',
        {
          spotId: spot.id,
          progress,
          sellerPrice: toNumber(price),
        },
        user,
      );
      navigation.goBack();
      setUpdatedBannerVisible(true);
    } catch (error) {
      setIsUpdating(false);
      let errorMessage = 'Failed to update spot. Please try again later.';
      if ((error as Error).message === 'ff_error/spot_unavailable') {
        errorMessage =
          'The spot is currently being booked and can thus not be updated.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <View style={globalStyles.row}>
        <DismissButton
          onPress={() => navigation.goBack()}
          disabled={isUpdating}
        />
        <Button
          mode="contained"
          onPress={updateSpot}
          style={[globalStyles.denseButton, globalStyles.topRightButton]}
          loading={isUpdating}
          disabled={!isValidSellerPrice(price) || isUpdating}>
          Save
        </Button>
      </View>
      <KeyboardAwareScrollView keyboardOpeningTime={Number.MAX_SAFE_INTEGER}>
        <View style={[globalStyles.marginHorizontal, styles.marginBottom]}>
          <Text style={styles.headerText}>Update your position in line</Text>
          <Progress progress={progress} setProgress={setProgress} />
          <Text style={[styles.headerText, styles.priceHeader]}>
            Update the price
          </Text>
          <Price price={price} setPrice={setPrice} autofocus={false} />
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 22,
    marginTop: 20,
    marginBottom: 30,
  },
  priceHeader: {
    marginTop: 50,
  },
  marginBottom: {
    marginBottom: 20,
  },
});

export default EditOffer;
