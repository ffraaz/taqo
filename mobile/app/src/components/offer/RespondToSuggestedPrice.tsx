import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Card, Text} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider.tsx';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import useSpotSubscription from '../../utils/useSpotSubscription.ts';
import {formatPrice, isAvailable, request} from '../../utils/Utils.ts';
import BulletList from '../commons/BulletList.tsx';
import DismissButton from '../commons/DismissButton.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import SpotCard from '../commons/SpotCard.tsx';

const RespondToSuggestedPrice = ({
  navigation,
  route,
}: RootStackScreenProps<'RespondToSuggestedPrice'>) => {
  const {spotId, sellerPrice, setPriceReductionAcceptedBannerVisible} =
    route.params;
  const [isUpdating, setIsUpdating] = useState(false);
  const spot = useSpotSubscription(spotId);
  const {user} = useAuth();

  const sellerInfo = [
    'Suggested price: ' + formatPrice(sellerPrice),
    'The potential buyer has not commited yet to buying the spot at that price.',
    'If you accept the suggested price, the spot is available to all users at this price.',
  ];

  useEffect(() => {
    if (!isAvailable(spot)) {
      navigation.goBack();
    } else if (!user) {
      navigation.navigate('LoginFlow', {
        targetScreen: 'RespondToSuggestedPrice',
      });
    }
  }, [navigation, spot, user]);

  const acceptSuggestedPrice = async () => {
    if (!spot) {
      return;
    }
    setIsUpdating(true);
    try {
      await request(
        'accept_suggested_price',
        {
          spotId,
          sellerPrice,
        },
        user,
      );
      navigation.goBack();
      setPriceReductionAcceptedBannerVisible(true);
    } catch (error) {
      setIsUpdating(false);
      let errorMessage = 'Failed to update price. Please try again later.';
      if ((error as Error).message === 'ff_error/spot_unavailable') {
        errorMessage =
          'The spot is currently being booked and can thus not be updated.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  if (spot) {
    return (
      <ScreenWrapper style={globalStyles.flex}>
        <DismissButton
          onPress={() => navigation.goBack()}
          disabled={isUpdating}
        />
        <View
          style={[
            globalStyles.marginHorizontal,
            globalStyles.flex,
            styles.container,
          ]}>
          <View>
            <SpotCard spot={spot} style={styles.spotCard} hidePrice={true} />
            <Text style={styles.headerText}>Respond to price suggestion</Text>
          </View>
          <ScrollView style={globalStyles.flex}>
            <Card
              theme={{colors: {elevation: {level1: '#f3f3f3'}}}}
              style={styles.infoCard}>
              <Card.Content>
                <BulletList items={sellerInfo} />
              </Card.Content>
            </Card>
          </ScrollView>
          <View style={globalStyles.row}>
            <Button
              mode="contained"
              buttonColor="red"
              onPress={() => navigation.goBack()}
              disabled={isUpdating}
              style={globalStyles.primaryButton}>
              Dismiss
            </Button>
            <Button
              mode="contained"
              buttonColor="green"
              onPress={acceptSuggestedPrice}
              loading={isUpdating}
              disabled={isUpdating}
              style={[
                globalStyles.primaryButton,
                globalStyles.flex,
                styles.acceptButton,
              ]}>
              Update to {formatPrice(sellerPrice)}
            </Button>
          </View>
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
  headerText: {
    fontSize: 22,
    marginBottom: 30,
  },
  spotCard: {
    marginBottom: 50,
  },
  acceptButton: {
    marginLeft: 20,
  },
  infoCard: {
    marginBottom: 40,
  },
});

export default RespondToSuggestedPrice;
