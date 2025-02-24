import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import globalStyles from '../../utils/styles';
import ContactMail from '../commons/ContactMail';
import DismissButton from '../commons/DismissButton.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import VerticallyCenteringView from '../commons/VerticallyCenteringView';

const Contact = () => {
  const navigation = useNavigation();

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <DismissButton onPress={() => navigation.goBack()} />
      <View style={[globalStyles.marginHorizontal]}>
        <Text style={[globalStyles.titleText, styles.titleText]}>Contact</Text>
        <Text>
          Don't hesitate to contact us at <ContactMail /> if there was a problem
          with your transaction. We are also always grateful for suggestions on
          how to improve the app.
        </Text>
      </View>
      <VerticallyCenteringView>
        <MaterialCommunityIcons
          name="comment-question-outline"
          size={100}
          color={'black'}
        />
      </VerticallyCenteringView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  titleText: {
    marginBottom: 60,
  },
});

export default Contact;
