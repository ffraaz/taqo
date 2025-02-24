import React, {useRef} from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface ShutterButtonProps {
  onPress: () => void;
}

const ShutterButton = ({onPress}: ShutterButtonProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const pressInAnimation = () => {
    Animated.spring(scaleValue, {
      toValue: 0.8,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const pressOutAnimation = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.shutterButtonOuterRing}>
      <TouchableWithoutFeedback
        onPressIn={pressInAnimation}
        onPressOut={pressOutAnimation}
        onPress={onPress}>
        <Animated.View
          style={[
            styles.shutterButtonInner,
            {
              transform: [{scale: scaleValue}],
            },
          ]}
        />
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  shutterButtonOuterRing: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});

export default ShutterButton;
