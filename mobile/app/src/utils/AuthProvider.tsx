import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import React, {createContext, useContext, useEffect, useState} from 'react';

import {config} from './Config';
import {saveUserDetails} from './Utils';

const AuthContext: React.Context<any> = createContext(null);
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isReviewer = user && config.reviewerIds.includes(user.uid);

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(async user_ => {
      setUser(user_);
      const messagingToken = await messaging().getToken();
      await saveUserDetails(user_, {messagingToken});
    });

    const messagingTokenSubscriber = messaging().onTokenRefresh(
      async messagingToken => {
        await saveUserDetails(user, {messagingToken});
      },
    );

    return () => {
      authSubscriber();
      messagingTokenSubscriber();
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isReviewer,
        signOut: () => auth().signOut(),
        isSigningIn,
        setIsSigningIn,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
