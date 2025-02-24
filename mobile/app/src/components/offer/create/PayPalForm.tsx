import {useFocusEffect} from '@react-navigation/native';
import React, {useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {Text} from 'react-native-paper';

import {useAuth} from '../../../utils/AuthProvider';
import globalStyles from '../../../utils/styles';
import {CreateOfferStackScreenProps} from '../../../utils/types.ts';
import {saveUserDetails} from '../../../utils/Utils';
import EmailForm from '../../commons/EmailForm';
import ConfirmEmailDialog from './ConfirmEmailDialog';
import NavigationWrapper from './NavigationWrapper';

interface PayPalFormProps {
  navigation: CreateOfferStackScreenProps<'PayPalForm'>['navigation'];
}

const PayPalForm = ({navigation}: PayPalFormProps) => {
  const {user} = useAuth();
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false);
  const textInputRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (textInputRef.current) {
        (textInputRef.current as any).focus();
      }
    }, []),
  );

  const onSubmit = async () => {
    if (!isValid) {
      return;
    }
    if (paypalEmail === user.email) {
      await submit(paypalEmail);
      return;
    }
    setIsConfirmDialogVisible(true);
    if (textInputRef.current) {
      (textInputRef.current as any).blur();
    }
  };

  const submit = async (email: string) => {
    try {
      await saveUserDetails(user, {paypalEmail: email});
      navigation.navigate('Summary');
    } catch (error) {
      console.error('Error saving user details: ', error);
      Alert.alert(
        'Error',
        'There was a problem saving your PayPal email. Please try again later.',
      );
    }
  };

  return (
    <NavigationWrapper
      navigation={navigation}
      onBack={() => navigation.goBack()}
      onNext={onSubmit}
      marginHorizontal={false}
      isForwardEnabled={isValid}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Text
          style={[
            globalStyles.titleText,
            styles.titleText,
            globalStyles.marginHorizontal,
          ]}>
          Enter your PayPal email address
        </Text>
        <ScrollView>
          <View style={[globalStyles.marginHorizontal, styles.container]}>
            <EmailForm
              inputText={paypalEmail}
              setInputText={setPaypalEmail}
              setIsValid={setIsValid}
              textInputRef={textInputRef}
              onContinue={onSubmit}
            />
            <Text style={styles.explainerText}>
              We send money to this address via PayPal when your spot is sold.
              It works even if you don't have a PayPal account yet.
            </Text>
            <ConfirmEmailDialog
              visible={isConfirmDialogVisible}
              onDismiss={() => {
                setIsConfirmDialogVisible(false);
                if (textInputRef.current) {
                  (textInputRef.current as any).focus();
                }
              }}
              onConfirm={async () => {
                setIsConfirmDialogVisible(false);
                await submit(paypalEmail);
              }}
              paypalEmail={paypalEmail}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </NavigationWrapper>
  );
};

const styles = StyleSheet.create({
  explainerText: {
    marginTop: 20,
    marginBottom: 100,
  },
  titleText: {
    marginBottom: 0,
  },
  container: {
    marginTop: 100,
  },
});

export default PayPalForm;
