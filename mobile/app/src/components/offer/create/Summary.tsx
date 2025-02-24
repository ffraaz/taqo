import firestore from '@react-native-firebase/firestore';
import React from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {ActivityIndicator, Button, Card, Text} from 'react-native-paper';

import {useAuth} from '../../../utils/AuthProvider';
import globalStyles from '../../../utils/styles';
import {
  CreateOfferStackScreenProps,
  Location,
  Spot,
} from '../../../utils/types.ts';
import {
  addDistance,
  requestPushPermission,
  toNumber,
} from '../../../utils/Utils';
import BulletList from '../../commons/BulletList';
import SpotCard from '../../commons/SpotCard';
import VerticallyCenteringView from '../../commons/VerticallyCenteringView';
import Warning from '../../commons/Warning';
import NavigationWrapper from './NavigationWrapper';

interface SummaryProps {
  price: string;
  progress: number;
  queueName: string;
  downloadUrl: string | null;
  location: Location;
  navigation: CreateOfferStackScreenProps<'Summary'>['navigation'];
  uploadError: boolean;
  setRetryUpload: (retryUpload: boolean) => void;
  retryUpload: boolean;
  setPublishedBannerVisible: (visible: boolean) => void;
}

const Summary = ({
  price,
  progress,
  queueName,
  downloadUrl,
  location,
  navigation,
  uploadError,
  setRetryUpload,
  retryUpload,
  setPublishedBannerVisible,
}: SummaryProps) => {
  const {user} = useAuth();

  const rawSpot = {
    queueName,
    progress,
    sellerPrice: toNumber(price),
    location,
  };
  const spot = addDistance(rawSpot as Spot, location);

  const sellerInfo = [
    'Others can book the spot without an additional confirmation by you.',
    'Please delete your spot immediately if you no longer want to sell it.',
    'When someone books your spot, they get a confirmation badge. Please leave the line when shown the badge.',
  ];

  const onPublish = async () => {
    try {
      const now = new Date();
      await firestore()
        .collection('spots')
        .add({
          sellerId: user.uid,
          sellerPrice: toNumber(price),
          progress,
          queueName,
          location,
          downloadUrl,
          createdAt: now.toISOString(),
          status: 'available',
        });
      setPublishedBannerVisible(true);
      await requestPushPermission();
    } catch (error) {
      console.error('Error creating Firestore document:', error);
      Alert.alert('Error', 'Failed to publish spot. Please try again later.');
    }
  };

  return (
    <NavigationWrapper
      navigation={navigation}
      marginHorizontal={false}
      onBack={() => navigation.goBack()}>
      {uploadError && (
        <VerticallyCenteringView>
          <Warning
            warningText={'Selfie upload failed. Please try again later.'}
            style={globalStyles.retryText}
          />
          <Button
            mode="contained"
            onPress={() => setRetryUpload(!retryUpload)}
            icon={'reload'}>
            Retry
          </Button>
        </VerticallyCenteringView>
      )}
      {!uploadError && !downloadUrl && (
        <VerticallyCenteringView>
          <ActivityIndicator />
        </VerticallyCenteringView>
      )}
      {downloadUrl && (
        <View style={globalStyles.flex}>
          <Text
            style={[
              globalStyles.titleText,
              styles.titleText,
              globalStyles.marginHorizontal,
            ]}>
            Summary
          </Text>
          <SpotCard
            spot={spot}
            isSeller={true}
            style={[globalStyles.marginHorizontal, styles.spotCard]}
          />
          <ScrollView style={globalStyles.flex}>
            <Card
              theme={{colors: {elevation: {level1: '#f3f3f3'}}}}
              style={[styles.infoCard, globalStyles.marginHorizontal]}>
              <Card.Content>
                <BulletList items={sellerInfo} />
              </Card.Content>
            </Card>
          </ScrollView>
          <Button
            mode="contained"
            onPress={onPublish}
            style={[
              globalStyles.primaryButton,
              globalStyles.marginHorizontal,
              styles.button,
            ]}>
            Publish
          </Button>
        </View>
      )}
    </NavigationWrapper>
  );
};

const styles = StyleSheet.create({
  titleText: {
    marginBottom: 40,
  },
  infoText: {
    fontSize: 16,
  },
  spotCard: {
    marginBottom: 20,
  },
  infoCard: {
    marginVertical: 10,
  },
  button: {
    marginTop: 30,
  },
});

export default Summary;
