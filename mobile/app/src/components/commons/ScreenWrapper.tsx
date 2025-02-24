import NetInfo from '@react-native-community/netinfo';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

import {useGlobalState} from '../../utils/GlobalStateProvider.tsx';
import globalStyles from '../../utils/styles.ts';
import BottomBanner from './BottomBanner.tsx';
import VerticallyCenteringView from './VerticallyCenteringView.tsx';
import Warning from './Warning.tsx';

interface BannerWrapperProps {
  children: React.ReactNode;
  safeAreaView?: boolean;
  style?: object;
}

const ScreenWrapper = ({
  children,
  safeAreaView = true,
  style = {},
}: BannerWrapperProps) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    return <ConnectivityError />;
  }

  if (safeAreaView) {
    return (
      <SafeAreaView style={[globalStyles.flex, style]}>
        {children}
        <Banners />
      </SafeAreaView>
    );
  } else {
    return (
      <View style={[globalStyles.flex, style]}>
        {children}
        <Banners />
      </View>
    );
  }
};

const ConnectivityError = () => {
  return (
    <VerticallyCenteringView>
      <Warning
        warningText="The internet connection appears to be offline."
        style={globalStyles.retryText}
      />
      <ActivityIndicator />
    </VerticallyCenteringView>
  );
};

const Banners = () => {
  const {
    priceReductionBannerVisible,
    setPriceReductionBannerVisible,
    priceReductionBannerText,
    priceReductionAcceptedBannerVisible,
    setPriceReductionAcceptedBannerVisible,
  } = useGlobalState();

  return (
    <View>
      <BottomBanner
        text={priceReductionBannerText}
        visible={priceReductionBannerVisible}
        setVisible={setPriceReductionBannerVisible}
      />
      <BottomBanner
        text={'Price updated successfully.'}
        visible={priceReductionAcceptedBannerVisible}
        setVisible={setPriceReductionAcceptedBannerVisible}
        success={true}
      />
    </View>
  );
};

export default ScreenWrapper;
