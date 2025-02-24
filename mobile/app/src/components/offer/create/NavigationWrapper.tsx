import React from 'react';
import {StyleSheet, View} from 'react-native';
import {IconButton} from 'react-native-paper';

import globalStyles from '../../../utils/styles';
import ScreenWrapper from '../../commons/ScreenWrapper';

interface NavigationWrapperProps {
  navigation: any;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  isForwardEnabled?: boolean;
  marginHorizontal?: boolean;
}

const NavigationWrapper = ({
  navigation,
  children,
  onNext,
  onBack,
  isForwardEnabled = true,
  marginHorizontal = true,
}: NavigationWrapperProps) => {
  return (
    <ScreenWrapper style={globalStyles.flex}>
      <View style={globalStyles.row}>
        {onBack && (
          <IconButton
            icon="arrow-left"
            size={25}
            iconColor={'black'}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          />
        )}
        {!(onBack && onNext) && <View />}
        {onNext && (
          <IconButton
            icon="arrow-right"
            mode="contained"
            iconColor="white"
            containerColor="black"
            size={25}
            onPress={onNext}
            disabled={!isForwardEnabled}
            style={styles.forwardButton}
          />
        )}
      </View>
      <View
        style={[
          marginHorizontal && globalStyles.marginHorizontal,
          globalStyles.flex,
        ]}>
        {children}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  forwardButton: {
    marginTop: 15,
    marginRight: 15,
  },
  backButton: {
    marginTop: 15,
  },
});

export default NavigationWrapper;
