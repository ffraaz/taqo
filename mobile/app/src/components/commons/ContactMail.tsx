import React from 'react';
import {Linking, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

const ContactMail = () => {
  const address = 'contact@taqo.app';
  return (
    <Text
      style={styles.link}
      onPress={() => Linking.openURL(`mailto:${address}`)}>
      {address}
    </Text>
  );
};

const styles = StyleSheet.create({
  link: {
    color: '#1A73E8',
  },
});

export default ContactMail;
