import React from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Text} from 'react-native-paper';

import globalStyles from '../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../utils/types.ts';
import {isValidSellerPrice} from '../../../utils/Utils.ts';
import Price from '../Price';
import NavigationWrapper from './NavigationWrapper';

interface SelectPriceProps {
  navigation: CreateOfferStackScreenProps<'SelectPrice'>['navigation'];
  price: string;
  setPrice: (price: string) => void;
}

const SelectPrice = ({navigation, price, setPrice}: SelectPriceProps) => {
  const onNext = () => {
    if (isValidSellerPrice(price)) {
      navigation.navigate('ExplainSelfie');
    }
  };

  return (
    <NavigationWrapper
      navigation={navigation}
      onBack={() => navigation.goBack()}
      onNext={onNext}
      isForwardEnabled={isValidSellerPrice(price)}>
      <KeyboardAwareScrollView keyboardOpeningTime={Number.MAX_SAFE_INTEGER}>
        <Text style={globalStyles.titleText}>Set a price for your spot</Text>
        <Price price={price} setPrice={setPrice} onSubmit={onNext} />
      </KeyboardAwareScrollView>
    </NavigationWrapper>
  );
};

export default SelectPrice;
