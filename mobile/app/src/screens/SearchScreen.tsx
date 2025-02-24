import firestore from '@react-native-firebase/firestore';
import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';

import BottomBanner from '../components/commons/BottomBanner.tsx';
import {LocationError} from '../components/commons/PermissionError';
import ScreenWrapper from '../components/commons/ScreenWrapper.tsx';
import VerticallyCenteringView from '../components/commons/VerticallyCenteringView';
import SpotListItem from '../components/search/SpotListItem';
import {useAuth} from '../utils/AuthProvider';
import {config} from '../utils/Config';
import {useLocation} from '../utils/LocationProvider';
import globalStyles from '../utils/styles';
import {Spot} from '../utils/types.ts';
import {spotFromDoc} from '../utils/Utils';

const SearchScreen = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const {user, isReviewer} = useAuth();
  const {location, locationError} = useLocation();
  const isFocused = useIsFocused();
  const [unavailableBannerVisible, setUnavailableBannerVisible] =
    useState(false);
  const [priceSuggestedBannerVisible, setPriceSuggestedBannerVisible] =
    useState(false);
  const [issueReportedBannerVisible, setIssueReportedBannerVisible] =
    useState(false);
  const isEmpty = spots.length === 0;

  useEffect(() => {
    if (location) {
      const spotsCollection = firestore().collection('spots');
      const query = spotsCollection.where('status', '==', 'available');
      const unsubscribe = query.onSnapshot(
        async querySnapshot => {
          const allSpots = querySnapshot.docs.map(doc =>
            spotFromDoc(doc, location),
          );
          const filteredSpots = allSpots.filter(
            spot => spot.buyerPrice || (user && spot.sellerId === user.uid),
          );

          const visibleSpots = filteredSpots.filter(spot =>
            isReviewer
              ? config.reviewerIds.includes(spot.sellerId)
              : !config.reviewerIds.includes(spot.sellerId),
          );

          const sortedSpots = visibleSpots.sort(
            (a, b) => a.distance - b.distance,
          );
          setSpots(sortedSpots);
          setIsLoading(false);
        },
        error => {
          setIsLoading(false);
          Alert.alert(
            'Error',
            'Failed to fetch spots. Please try again later.',
          );
          console.error(error);
        },
      );

      return () => unsubscribe();
    }
  }, [isReviewer, location, user]);

  useEffect(() => {
    if (isFocused && selectedSpotId) {
      const spotRef = firestore().collection('spots').doc(selectedSpotId);
      const unsubscribe = spotRef.onSnapshot(
        doc => {
          if (!doc.exists || doc.data()?.status !== 'available') {
            setUnavailableBannerVisible(true);
            setSelectedSpotId(null);
          }
        },
        error => {
          console.error('Error listening for deletion:', error);
        },
      );
      return () => unsubscribe();
    }
  }, [selectedSpotId, isFocused]);

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
    <TouchableWithoutFeedback onPress={() => setSelectedSpotId(null)}>
      <View style={globalStyles.flex}>
        <ScreenWrapper style={globalStyles.flex}>
          {isEmpty && (
            <VerticallyCenteringView>
              <Text>No spots available.</Text>
            </VerticallyCenteringView>
          )}
          {!isEmpty && (
            <FlatList
              data={spots}
              style={styles.list}
              keyExtractor={(item: Spot) => item.id}
              renderItem={({item}) => (
                <SpotListItem
                  spot={item}
                  selectedSpotId={selectedSpotId}
                  setSelectedSpotId={setSelectedSpotId}
                  setIssueReportedBannerVisible={setIssueReportedBannerVisible}
                  setPriceSuggestedBannerVisible={
                    setPriceSuggestedBannerVisible
                  }
                />
              )}
            />
          )}
          <BottomBanner
            text={'This spot is no longer available.'}
            visible={unavailableBannerVisible}
            setVisible={setUnavailableBannerVisible}
          />
          <BottomBanner
            text={'Price suggested successfully.'}
            visible={priceSuggestedBannerVisible}
            setVisible={setPriceSuggestedBannerVisible}
            success={true}
          />
          <BottomBanner
            text={'Issue reported successfully.'}
            visible={issueReportedBannerVisible}
            setVisible={setIssueReportedBannerVisible}
            success={true}
          />
        </ScreenWrapper>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
  },
});

export default SearchScreen;
