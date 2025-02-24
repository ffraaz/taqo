import firestore from '@react-native-firebase/firestore';
import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';

import {useAuth} from '../../../../utils/AuthProvider';
import globalStyles from '../../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../../utils/types.ts';
import CameraView from './CameraView';
import ShowSelfie from './ShowSelfie';

interface TakeSelfieProps {
  navigation: CreateOfferStackScreenProps<'TakeSelfie'>['navigation'];
  photoUri: string | null;
  setPhotoUri: (uri: string) => void;
}

const TakeSelfie = ({navigation, photoUri, setPhotoUri}: TakeSelfieProps) => {
  const [showCamera, setShowCamera] = useState(true);
  const {user} = useAuth();

  const nextScreen = async () => {
    const payPalExists = await checkPayPalEmailExists();
    if (payPalExists) {
      navigation.navigate('Summary');
    } else {
      navigation.navigate('PayPalForm');
    }
  };

  const checkPayPalEmailExists = async () => {
    try {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      return !!(userDoc.exists && userDoc.data()?.paypalEmail);
    } catch (error) {
      return false;
    }
  };

  return (
    <View style={globalStyles.flex}>
      <View style={styles.backgroundFill} />
      <SafeAreaView style={globalStyles.flex}>
        <View style={globalStyles.cameraButtonBar} />
        {showCamera ? (
          <CameraView
            setPhotoUri={setPhotoUri}
            onCancel={() => navigation.goBack()}
            setShowCamera={setShowCamera}
          />
        ) : (
          <ShowSelfie
            photoUri={photoUri as string}
            onRepeat={() => setShowCamera(true)}
            onUsePhoto={nextScreen}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundFill: {
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default TakeSelfie;
