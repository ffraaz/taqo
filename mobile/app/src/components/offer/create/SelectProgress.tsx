import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';

import globalStyles from '../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../utils/types.ts';
import Progress from '../Progress';
import NavigationWrapper from './NavigationWrapper';

interface SelectProgressProps {
  navigation: CreateOfferStackScreenProps<'SelectProgress'>['navigation'];
  progress: number;
  setProgress: (progress: number) => void;
}

const SelectProgress = ({
  navigation,
  progress,
  setProgress,
}: SelectProgressProps) => {
  return (
    <NavigationWrapper
      navigation={navigation}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('SelectPrice')}>
      <View>
        <Text style={globalStyles.titleText}>Where in the line are you?</Text>
        <Progress progress={progress} setProgress={setProgress} />
      </View>
    </NavigationWrapper>
  );
};

export default SelectProgress;
