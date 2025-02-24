import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native-paper';

import globalStyles from '../../../../utils/styles';

interface ShowSelfieProps {
  photoUri: string;
  onRepeat: () => void;
  onUsePhoto: () => void;
}

const ShowSelfie = ({photoUri, onRepeat, onUsePhoto}: ShowSelfieProps) => {
  return (
    <View style={globalStyles.flex}>
      <Image source={{uri: photoUri}} style={globalStyles.flex} />
      <View style={globalStyles.cameraButtonBar}>
        <TouchableOpacity
          onPress={onRepeat}
          style={globalStyles.cameraCancelButton}
          hitSlop={globalStyles.hitSlop}>
          <Text style={globalStyles.cameraButtonText}>Repeat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onUsePhoto}
          style={styles.usePhotoButton}
          hitSlop={globalStyles.hitSlop}>
          <Text style={globalStyles.cameraButtonText}>Use Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  usePhotoButton: {
    position: 'absolute',
    right: 20,
  },
});

export default ShowSelfie;
