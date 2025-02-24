import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';
import {useCameraPermission} from 'react-native-vision-camera';

import globalStyles from '../../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../../utils/types.ts';
import NavigationWrapper from '../NavigationWrapper';

interface ExplainSelfieProps {
  navigation: CreateOfferStackScreenProps<'ExplainSelfie'>['navigation'];
}

const ExplainSelfie = ({navigation}: ExplainSelfieProps) => {
  const {hasPermission, requestPermission} = useCameraPermission();

  const onNext = async () => {
    if (!hasPermission) {
      await requestPermission().catch(() => {});
    }
    navigation.navigate('TakeSelfie');
  };

  return (
    <NavigationWrapper
      navigation={navigation}
      onBack={() => navigation.goBack()}
      onNext={onNext}>
      <View>
        <Text style={globalStyles.titleText}>Take a selfie</Text>
        <Text>
          Next, let's take a selfie so buyers can find you. The selfie is only
          shown to people who are within a 1 km radius of your spot.
        </Text>
      </View>
    </NavigationWrapper>
  );
};

export default ExplainSelfie;
