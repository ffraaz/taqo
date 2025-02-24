import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';

interface WarningProps {
  warningText: string | JSX.Element;
  style?: object;
  darkBackground?: boolean;
}

const Warning = ({
  warningText,
  style,
  darkBackground = false,
}: WarningProps) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: darkBackground ? '#4F4F4F' : 'white',
      padding: 5,
      borderRadius: 5,
    },
    text: {
      color: darkBackground ? 'white' : 'black',
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{warningText}</Text>
    </View>
  );
};

export default Warning;
