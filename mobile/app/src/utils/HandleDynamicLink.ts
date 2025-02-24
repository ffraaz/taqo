import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {useStripe} from '@stripe/stripe-react-native';
import {useEffect} from 'react';
import {Alert, Linking} from 'react-native';
import {EmitterSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

import {useAuth} from './AuthProvider';

const useHandleDynamicLink = () => {
  const {handleURLCallback} = useStripe();
  const {setIsSigningIn} = useAuth();

  useEffect(() => {
    let subscription: EmitterSubscription;

    const handleDynamicLink = async (url: string) => {
      if (auth().isSignInWithEmailLink(url)) {
        try {
          setIsSigningIn(true);
          const email = await AsyncStorage.getItem('emailForSignIn');
          if (email) {
            await auth().signInWithEmailLink(email, url);
          }
        } catch (error) {
          console.error('Error handling sign-in link:', error);
          let errorMessage = 'Failed to sign in. Please try again later.';
          if (
            (error as FirebaseAuthTypes.NativeFirebaseAuthError).code ===
            'auth/user-disabled'
          ) {
            errorMessage =
              'This account has been deleted. Please sign up with a new email address.';
          }
          Alert.alert('Error', errorMessage);
        } finally {
          setIsSigningIn(false);
        }
      } else {
        await handleURLCallback(url);
      }
    };

    const initDeepLinkListener = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDynamicLink(initialUrl);
      }

      subscription = Linking.addEventListener('url', ({url}) =>
        handleDynamicLink(url),
      );
    };

    initDeepLinkListener().catch(error => console.error(error));

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [handleURLCallback, setIsSigningIn]);
};

export default useHandleDynamicLink;
