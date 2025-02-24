import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';

import globalStyles from '../../utils/styles';
import DismissButton from '../commons/DismissButton';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';

const SpotDeletedDueToIssue = () => {
  const navigation = useNavigation();

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <DismissButton onPress={() => navigation.goBack()} />
      <View
        style={[
          globalStyles.marginHorizontal,
          globalStyles.flex,
          styles.container,
        ]}>
        <Card style={globalStyles.whiteBackground}>
          <Card.Title title="Action required" titleVariant="titleLarge" />
          <Card.Content>
            <Text>
              Multiple potential buyers were not able to find you. Your spot has
              been deleted. Please create a new offer if you still want to sell
              your spot.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
  },
});

export default SpotDeletedDueToIssue;
