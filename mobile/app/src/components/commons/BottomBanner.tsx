import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Snackbar, Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

interface BottomBannerProps {
  text: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  success?: boolean;
}

const BottomBanner = ({
  text,
  visible,
  setVisible,
  success = false,
}: BottomBannerProps) => {
  return (
    <Snackbar
      visible={visible}
      onIconPress={() => setVisible(false)}
      style={[styles.banner, success ? styles.greenBackground : {}]}
      duration={success ? 2000 : 4000}
      wrapperStyle={styles.wrapper}
      onDismiss={() => setVisible(false)}>
      {success && (
        <View style={styles.container}>
          <Icon
            name="checkmark-circle-outline"
            size={25}
            color={'white'}
            style={styles.icon}
          />
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
      {!success && <Text style={styles.text}>{text}</Text>}
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 5,
  },
  greenBackground: {
    backgroundColor: 'green',
  },
  text: {
    color: 'white',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 20,
  },
  wrapper: {
    paddingBottom: 0,
  },
});

export default BottomBanner;
