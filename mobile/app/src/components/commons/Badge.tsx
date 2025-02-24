import React from 'react';
import {Image, Platform, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface BadgeProps {
  downloadUrl: string;
}

const Badge = ({downloadUrl}: BadgeProps) => {
  return (
    <View>
      <Image source={{uri: downloadUrl}} style={styles.image} />
      <Icon
        name="checkmark-circle-outline"
        size={290}
        color="green"
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 200,
    width: 200,
    resizeMode: 'cover',
    borderRadius: 200,
  },
  icon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -45 : -47,
    left: -45,
  },
});

export default Badge;
