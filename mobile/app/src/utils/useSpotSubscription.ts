import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';

import {useLocation} from './LocationProvider.tsx';
import {Spot} from './types.ts';
import {spotFromDoc} from './Utils.ts';

const useSpotSubscription = (spotId: string) => {
  const [spot, setSpot] = useState<Spot | null>(null);
  const {location} = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    if (location) {
      const spotRef = firestore().collection('spots').doc(spotId);
      const unsubscribe = spotRef.onSnapshot(
        doc => {
          if (doc.exists) {
            const spot_ = spotFromDoc(doc, location);
            setSpot(spot_);
          } else {
            navigation.goBack();
          }
        },
        error => {
          Alert.alert('Error', 'Failed to fetch spot. Please try again later.');
          navigation.goBack();
          console.error('Error fetching spot:', error);
        },
      );

      return () => unsubscribe();
    }
  }, [spotId, location, navigation]);

  return spot;
};

export default useSpotSubscription;
