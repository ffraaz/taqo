import Slider from '@react-native-community/slider';
import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';

import globalStyles from '../../utils/styles';

interface ProgressProps {
  progress: number;
  setProgress: (value: number) => void;
}

const Progress = ({progress, setProgress}: ProgressProps) => {
  return (
    <View>
      <View style={[globalStyles.row, styles.labelContainer]}>
        <Text style={styles.label}>Back</Text>
        <Text style={styles.label}>Front</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={99}
        minimumTrackTintColor="#000000"
        maximumTrackTintColor="#FF0000"
        step={1}
        value={progress}
        style={styles.slider}
        onSlidingComplete={value => setProgress(value)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    marginHorizontal: Platform.OS === 'ios' ? 3 : 15,
  },
  label: {
    fontSize: 16,
  },
  slider: {
    height: 50,
  },
});

export default Progress;
