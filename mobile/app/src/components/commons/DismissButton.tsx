import React from 'react';
import {StyleSheet} from 'react-native';
import {IconButton} from 'react-native-paper';

const DismissButton = ({...props}) => {
  return (
    <IconButton
      icon="close"
      size={25}
      iconColor={'black'}
      style={styles.button}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 5,
  },
});

export default DismissButton;
