import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {ParamListBase, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {ActivityIndicator, Button, Text, TextInput} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import {config} from '../../utils/Config.ts';
import globalStyles from '../../utils/styles';
import type {RootStackScreenProps} from '../../utils/types.ts';
import DismissButton from './DismissButton';
import EmailForm from './EmailForm';
import ScreenWrapper from './ScreenWrapper.tsx';
import VerticallyCenteringView from './VerticallyCenteringView';

const LoginFlow = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {user, isSigningIn} = useAuth();
  const [authenticating, setAuthenticating] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const route = useRoute<RootStackScreenProps<'LoginFlow'>['route']>();
  const targetScreen = route.params.targetScreen;
  const [password, setPassword] = useState('');
  const isReviewerEmail = config.reviewerEmailAddresses.includes(email);

  useEffect(() => {
    if (user) {
      if (targetScreen === 'RespondToSuggestedPrice') {
        navigation.goBack();
      } else {
        navigation.navigate(targetScreen);
      }
    }
  }, [user, navigation, targetScreen]);

  const onContinue = async () => {
    if (!isEmailValid) {
      return;
    }
    if (isReviewerEmail) {
      await loginWithPassword();
    } else {
      await sendSignInLink();
    }
  };

  const sendSignInLink = async () => {
    const actionCodeSettings = {
      handleCodeInApp: true,
      url: 'https://FF_REDACTED.com',
      iOS: {
        bundleId: config.bundleId,
      },
      android: {
        packageName: config.bundleId,
      },
    };
    try {
      setAuthenticating(true);
      Keyboard.dismiss();
      await AsyncStorage.setItem('emailForSignIn', email);
      await auth().sendSignInLinkToEmail(email, actionCodeSettings);
      setSentEmail(true);
    } catch (error) {
      setAuthenticating(false);
      const authError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      let errorMessage = 'Failed to send login link. Please try again later.';
      if (authError.code === 'auth/user-disabled') {
        errorMessage =
          'This account has been deleted. Please sign up with a new email address.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const loginWithPassword = async () => {
    try {
      setAuthenticating(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      setAuthenticating(false);
      Alert.alert('Error', 'Failed to login with given email and password.');
    }
  };

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <DismissButton
        onPress={() => navigation.goBack()}
        disabled={isSigningIn}
      />
      <View style={[globalStyles.marginHorizontal, globalStyles.flex]}>
        {isSigningIn && (
          <VerticallyCenteringView>
            <ActivityIndicator />
          </VerticallyCenteringView>
        )}
        {!isSigningIn && !sentEmail && (
          <KeyboardAwareScrollView
            keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
            keyboardShouldPersistTaps="handled">
            <Text style={globalStyles.titleText}>
              Continue with your email address
            </Text>
            <EmailForm
              inputText={email}
              setInputText={setEmail}
              setIsValid={setIsEmailValid}
              onContinue={onContinue}
            />
            {isReviewerEmail && (
              <TextInput
                outlineStyle={globalStyles.textInput}
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                placeholder="Password"
                autoCapitalize="none"
                autoFocus={true}
                style={styles.continueButton}
              />
            )}
            <Button
              mode="contained"
              onPress={onContinue}
              style={styles.continueButton}
              loading={authenticating}
              disabled={!isEmailValid || authenticating}>
              Continue
            </Button>
          </KeyboardAwareScrollView>
        )}

        {!isSigningIn && sentEmail && (
          <View>
            <Text style={styles.explainerText}>
              To continue, please click the link in the email we sent to {email}
              . Check your spam folder as well.
            </Text>
            {Platform.OS === 'ios' && (
              <Button
                mode="contained"
                onPress={() => Linking.openURL('message://')}
                style={globalStyles.denseButton}>
                Open Mail
              </Button>
            )}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  explainerText: {
    marginVertical: 40,
  },
  continueButton: {
    marginVertical: 20,
  },
});

export default LoginFlow;
