import firestore from '@react-native-firebase/firestore';
import React, {useEffect, useState} from 'react';
import {Linking, Modal, Platform, StyleSheet} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {Button, Card, Text} from 'react-native-paper';

import globalStyles from '../../utils/styles';
import {versionSmallerThan} from '../../utils/Utils';
import VerticallyCenteringView from './VerticallyCenteringView';

export const UpdateModal = () => {
  const [minRequiredVersion, setMinRequiredVersion] = useState(null);
  const installedVersion = DeviceInfo.getVersion();
  const isUpdateRequired = !!(
    minRequiredVersion &&
    versionSmallerThan(installedVersion, minRequiredVersion)
  );
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/de/app/taqo-skip-the-line/id6502012276'
      : 'https://play.google.com/store/apps/details?id=com.FF_REDACTED.taqo';

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('config')
      .doc('appVersion')
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          setMinRequiredVersion(snapshot.data()?.minRequired);
        }
      });

    return () => unsubscribe();
  }, []);

  return (
    <Modal visible={isUpdateRequired} animationType="fade">
      <VerticallyCenteringView style={styles.container}>
        <Card
          style={[globalStyles.whiteBackground, globalStyles.marginHorizontal]}>
          <Card.Title title="Update available" titleVariant="titleMedium" />
          <Card.Content>
            <Text>
              It looks like you are using an outdated version of the app. Please
              update the app to continue using it.
            </Text>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => Linking.openURL(url)}>
              Update now
            </Button>
          </Card.Content>
        </Card>
      </VerticallyCenteringView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 40,
  },
  container: {
    backgroundColor: '#e3e3e3',
  },
});
