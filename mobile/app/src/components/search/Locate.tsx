import React, {useEffect, useState} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import {ActivityIndicator, IconButton} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider.tsx';
import globalStyles from '../../utils/styles';
import {RootStackScreenProps} from '../../utils/types.ts';
import useSpotSubscription from '../../utils/useSpotSubscription.ts';
import {isAvailable, request} from '../../utils/Utils.ts';
import ConfirmDialog from '../commons/ConfirmDialog.tsx';
import DismissButton from '../commons/DismissButton.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import VerticallyCenteringView from '../commons/VerticallyCenteringView';
import Warning from '../commons/Warning';

const Locate = ({navigation, route}: RootStackScreenProps<'Locate'>) => {
  const {spotId, setIssueReportedBannerVisible} = route.params;
  const spot = useSpotSubscription(spotId);
  const [isLoading, setIsLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const {user} = useAuth();
  const styles = StyleSheet.create({
    image: {
      flex: isLoading || error ? 0.001 : 1,
      resizeMode: 'cover',
    },
    button: {
      margin: 5,
    },
  });

  useEffect(() => {
    if (!user || !isAvailable(spot)) {
      navigation.goBack();
    }
  }, [navigation, spot, user]);

  const reportAnIssue = async () => {
    try {
      setIsReporting(true);
      await request('report_issue', {spotId}, user);
      navigation.goBack();
      setIssueReportedBannerVisible(true);
    } catch (error_) {
      Alert.alert('Error', 'Failed to report issue. Please try again later.');
      setDialogVisible(false);
      console.error('Error reporting an issue:', error_);
    } finally {
      setIsReporting(false);
    }
  };

  if (spot) {
    return (
      <ScreenWrapper style={globalStyles.flex} safeAreaView={false}>
        <View style={globalStyles.row}>
          <DismissButton onPress={() => navigation.goBack()} />
          <IconButton
            icon="alert"
            size={25}
            style={styles.button}
            onPress={() => setDialogVisible(true)}
          />
        </View>

        {isLoading && (
          <VerticallyCenteringView>
            <ActivityIndicator />
          </VerticallyCenteringView>
        )}
        {error && (
          <VerticallyCenteringView>
            <Warning warningText={'Failed to load image.'} />
          </VerticallyCenteringView>
        )}
        <Image
          source={{uri: spot.downloadUrl}}
          style={styles.image}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
        <ConfirmDialog
          visible={dialogVisible}
          title={'Report an issue'}
          text={"I'm not able to find the seller."}
          onDismiss={() => setDialogVisible(false)}
          onConfirm={reportAnIssue}
          loading={isReporting}
        />
      </ScreenWrapper>
    );
  } else {
    return null;
  }
};

export default Locate;
