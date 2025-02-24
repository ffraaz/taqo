import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useRef} from 'react';
import {Keyboard, TouchableWithoutFeedback} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Text, TextInput} from 'react-native-paper';

import globalStyles from '../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../utils/types.ts';
import NavigationWrapper from './NavigationWrapper';

interface SelectQueueProps {
  navigation: CreateOfferStackScreenProps<'SelectQueue'>['navigation'];
  queueName: string;
  setQueueName: (queueName: string) => void;
  setIsQueueNameFocused: (isQueueNameFocused: boolean) => void;
  refreshLocation: boolean;
  setRefreshLocation: (refreshLocation: boolean) => void;
}

const SelectQueue = ({
  navigation,
  queueName,
  setQueueName,
  setIsQueueNameFocused,
  refreshLocation,
  setRefreshLocation,
}: SelectQueueProps) => {
  const textInputRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (textInputRef.current) {
        (textInputRef.current as any).focus();
      }
    }, []),
  );

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (textInputRef.current) {
          (textInputRef.current as any).blur();
        }
      },
    );

    return () => keyboardDidHideListener.remove();
  }, []);

  const onNext = () => {
    if (queueName.length > 0) {
      setRefreshLocation(!refreshLocation);
      navigation.navigate('SelectProgress');
    }
  };

  return (
    <NavigationWrapper
      navigation={navigation}
      onNext={onNext}
      isForwardEnabled={queueName.length > 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView keyboardOpeningTime={Number.MAX_SAFE_INTEGER}>
          <Text style={globalStyles.titleText}>Which venue are you at?</Text>
          <TextInput
            ref={textInputRef}
            outlineStyle={globalStyles.textInput}
            mode="outlined"
            placeholder="Restaurant XYZ"
            onChangeText={setQueueName}
            value={queueName}
            autoFocus={true}
            onFocus={() => setIsQueueNameFocused(true)}
            onBlur={() => setIsQueueNameFocused(false)}
            onSubmitEditing={onNext}
            placeholderTextColor="gray"
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
          />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </NavigationWrapper>
  );
};

export default SelectQueue;
