import React from 'react';
import {View} from 'react-native';

import {useLocation} from '../../utils/LocationProvider';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import useSpotSubscription from '../../utils/useSpotSubscription.ts';
import BookingSuccess from '../commons/BookingSuccess';
import DismissButton from '../commons/DismissButton.tsx';
import {LocationError} from '../commons/PermissionError';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import SpotCard from '../commons/SpotCard';

const TransactionSuccess = ({
  navigation,
  route,
}: RootStackScreenProps<'TransactionSuccess'>) => {
  const {spotId} = route.params;
  const spot = useSpotSubscription(spotId);
  const {locationError} = useLocation();

  if (locationError) {
    return <LocationError />;
  }

  if (!spot) {
    return null;
  }

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <DismissButton onPress={() => navigation.goBack()} />
      <SpotCard spot={spot} style={globalStyles.marginHorizontal} />
      <View style={[globalStyles.marginHorizontal, globalStyles.flex]}>
        <BookingSuccess downloadUrl={spot.downloadUrl} />
      </View>
    </ScreenWrapper>
  );
};

export default TransactionSuccess;
