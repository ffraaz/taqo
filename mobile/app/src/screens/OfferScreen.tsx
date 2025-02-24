import firestore from '@react-native-firebase/firestore';
import React, {useEffect, useState} from 'react';
import {Alert, View} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

import BottomBanner from '../components/commons/BottomBanner.tsx';
import {LocationError} from '../components/commons/PermissionError';
import VerticallyCenteringView from '../components/commons/VerticallyCenteringView';
import ActiveOffer from '../components/offer/ActiveOffer';
import CreateOffer from '../components/offer/CreateOffer';
import {useAuth} from '../utils/AuthProvider';
import {useGlobalState} from '../utils/GlobalStateProvider.tsx';
import {useLocation} from '../utils/LocationProvider';
import globalStyles from '../utils/styles.ts';
import {BottomTabsScreenProps, Spot} from '../utils/types.ts';
import {spotFromDoc} from '../utils/Utils';

const OfferScreen = ({navigation, route}: BottomTabsScreenProps<'Offer'>) => {
  const {user} = useAuth();
  const {location, locationError} = useLocation();
  const [spot, setSpot] = useState<Spot | null>(null);
  const {editable, setEditable} = useGlobalState();
  const [isLoading, setIsLoading] = useState(true);
  const [deletedBannerVisible, setDeletedBannerVisible] = useState(false);
  const [publishedBannerVisible, setPublishedBannerVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      navigation.navigate('LoginFlow', {targetScreen: 'Offer'});
    }
    if (user && location) {
      const subscriber = firestore()
        .collection('spots')
        .where('sellerId', '==', user.uid)
        .where('status', 'not-in', ['sold', 'deleted'])
        .onSnapshot(
          querySnapshot => {
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const spot_ = spotFromDoc(doc, location);
              setSpot(spot_);
              setEditable(spot_.status === 'available');
              navigation.setOptions({tabBarStyle: {}});
            } else {
              setSpot(null);
              setEditable(false);
            }
            setIsLoading(false);
          },
          error => {
            setIsLoading(false);
            Alert.alert(
              'Error',
              'Failed to load offer. Please try again later.',
            );
            console.error('Error fetching active offer:', error);
          },
        );
      return () => subscriber();
    }
  }, [location, navigation, user, spot, setEditable]);

  if (locationError) {
    return <LocationError />;
  }

  if (isLoading) {
    return (
      <VerticallyCenteringView>
        <ActivityIndicator />
      </VerticallyCenteringView>
    );
  }

  return (
    <View style={globalStyles.flex}>
      {spot && (
        <ActiveOffer
          spot={spot}
          editable={editable}
          setDeletedBannerVisible={setDeletedBannerVisible}
        />
      )}
      {!spot && (
        <CreateOffer
          navigation={navigation}
          route={route}
          setPublishedBannerVisible={setPublishedBannerVisible}
        />
      )}
      <BottomBanner
        text={'Spot deleted successfully.'}
        visible={deletedBannerVisible}
        setVisible={setDeletedBannerVisible}
        success={true}
      />
      <BottomBanner
        text={'Spot published successfully.'}
        visible={publishedBannerVisible}
        setVisible={setPublishedBannerVisible}
        success={true}
      />
    </View>
  );
};

export default OfferScreen;
