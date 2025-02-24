import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, TouchableHighlight, View} from 'react-native';
import {isDisplayZoomed} from 'react-native-device-info';
import {Button} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import globalStyles from '../../utils/styles';
import {Spot} from '../../utils/types.ts';
import SpotCard from '../commons/SpotCard';
import Warning from '../commons/Warning';

interface SpotListItemProps {
  spot: Spot;
  selectedSpotId: string | null;
  setSelectedSpotId: (id: string | null) => void;
  setIssueReportedBannerVisible: (visible: boolean) => void;
  setPriceSuggestedBannerVisible: (visible: boolean) => void;
}

const SpotListItem = ({
  spot,
  selectedSpotId,
  setSelectedSpotId,
  setIssueReportedBannerVisible,
  setPriceSuggestedBannerVisible,
}: SpotListItemProps) => {
  const {user, isReviewer} = useAuth();
  const isSelected = selectedSpotId === spot.id;
  const isSeller = user && user.uid === spot.sellerId;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const expanded = isSelected && user && !isSeller;
  const closeEnough = spot.distance <= 1 || isReviewer;
  const zoomedButton = isDisplayZoomed();

  const onPress = () => {
    if (!user) {
      navigation.navigate('LoginFlow', {targetScreen: 'Search'});
      setSelectedSpotId(spot.id);
    } else if (isSeller) {
      navigation.navigate('Offer');
      setSelectedSpotId(null);
    } else if (isSelected) {
      setSelectedSpotId(null);
    } else {
      setSelectedSpotId(spot.id);
    }
  };

  return (
    <TouchableHighlight
      underlayColor="white"
      onPress={onPress}
      style={styles.item}>
      <View>
        <SpotCard
          spot={spot}
          hidePrice={isSeller}
          color={isSelected ? '#e3e3e3' : 'white'}>
          {expanded && closeEnough && (
            <View style={[globalStyles.row, styles.expandedContent]}>
              <Button
                mode="contained"
                labelStyle={zoomedButton && styles.zoomedButton}
                maxFontSizeMultiplier={1}
                onPress={() =>
                  navigation.navigate('Locate', {
                    spotId: spot.id,
                    setIssueReportedBannerVisible,
                  })
                }>
                Find
              </Button>
              <Button
                mode="contained"
                labelStyle={zoomedButton && styles.zoomedButton}
                maxFontSizeMultiplier={1}
                onPress={() =>
                  navigation.navigate('Negotiate', {
                    spotId: spot.id,
                    setPriceSuggestedBannerVisible,
                  })
                }>
                Negotiate
              </Button>
              <Button
                mode="contained"
                labelStyle={zoomedButton && styles.zoomedButton}
                maxFontSizeMultiplier={1}
                onPress={() =>
                  navigation.navigate('BookSpot', {
                    spotId: spot.id,
                    setSelectedSpotId,
                  })
                }>
                Book
              </Button>
            </View>
          )}
          {expanded && !closeEnough && (
            <Warning
              darkBackground={true}
              warningText={'Move closer to the spot to book it.'}
              style={styles.expandedContent}
            />
          )}
        </SpotCard>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  item: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  expandedContent: {
    marginTop: 20,
  },
  zoomedButton: {
    fontSize: 10,
  },
});

export default SpotListItem;
