import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import globalStyles from '../../utils/styles';
import DismissButton from '../commons/DismissButton';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import VerticallyCenteringView from '../commons/VerticallyCenteringView';

const SoldSpot = () => {
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
          <Card.Title title="Success" titleVariant="titleLarge" />
          <Card.Content>
            <Text>
              The spot has been sold successfully. Please swap places with the
              buyer now. We will send you the money via PayPal within the next
              24 hours.
            </Text>
          </Card.Content>
        </Card>
        <VerticallyCenteringView>
          <MaterialCommunityIcons
            name="check-decagram"
            size={200}
            color="green"
          />
        </VerticallyCenteringView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
  },
});

export default SoldSpot;
