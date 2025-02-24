import React from 'react';
import {StyleSheet, View} from 'react-native';

import globalStyles from '../../utils/styles.ts';

interface Props {
  children: React.ReactNode;
  style?: object;
}

const VerticallyCenteringView = ({children, style = {}}: Props) => {
  return (
    <View style={[globalStyles.flex, styles.container, style]}>{children}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VerticallyCenteringView;
