import firestore from '@react-native-firebase/firestore';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StripeProvider} from '@stripe/stripe-react-native';
import React from 'react';
import {LogBox} from 'react-native';
import BootSplash from 'react-native-bootsplash';
import {MD3LightTheme, PaperProvider} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginFlow from './src/components/commons/LoginFlow';
import {UpdateModal} from './src/components/commons/UpdateModal';
import EditOffer from './src/components/offer/EditOffer.tsx';
import RespondToSuggestedPrice from './src/components/offer/RespondToSuggestedPrice.tsx';
import SoldSpot from './src/components/offer/SoldSpot';
import SpotDeletedDueToIssue from './src/components/offer/SpotDeletedDueToIssue.tsx';
import Contact from './src/components/profile/Contact.tsx';
import Transactions from './src/components/profile/Transactions';
import TransactionSuccess from './src/components/profile/TransactionSuccess.tsx';
import BookSpot from './src/components/search/BookSpot';
import BookWithPayPal from './src/components/search/BookWithPayPal.tsx';
import Locate from './src/components/search/Locate.tsx';
import Negotiate from './src/components/search/Negotiate.tsx';
import OfferScreen from './src/screens/OfferScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import {AuthProvider, useAuth} from './src/utils/AuthProvider';
import {config} from './src/utils/Config';
import {
  GlobalStateProvider,
  useGlobalState,
} from './src/utils/GlobalStateProvider.tsx';
import useHandleDynamicLink from './src/utils/HandleDynamicLink';
import useHandlePushNotification from './src/utils/HandlePushNotification';
import {LocationProvider} from './src/utils/LocationProvider';
import type {BottomTabsParamList, RootStackParamList} from './src/utils/types';

firestore().settings({persistence: false});
if (!config.remoteBackend) {
  firestore().useEmulator(config.devIpAddress, 8080);
}

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const RootStack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabsParamList>();

function App() {
  return (
    <GlobalStateProvider>
      <AuthProvider>
        <_App />
      </AuthProvider>
    </GlobalStateProvider>
  );
}

function _App() {
  useHandleDynamicLink();
  const {payPalSheetDismissable} = useGlobalState();

  return (
    <PaperProvider theme={TaqoTheme}>
      <StripeProvider
        publishableKey={config.stripePublishableKey}
        merchantIdentifier="merchant.com.FF_REDACTED.taqo"
        urlScheme="com.FF_REDACTED.taqo">
        <LocationProvider>
          <UpdateModal />
          <NavigationContainer
            theme={WhiteBackground}
            onReady={() => BootSplash.hide()}>
            <RootStack.Navigator
              screenOptions={{
                headerShown: false,
              }}>
              <RootStack.Screen name="BottomTabs" component={BottomTabs} />
              <RootStack.Screen
                name="LoginFlow"
                component={LoginFlow}
                options={{
                  presentation: 'fullScreenModal',
                }}
              />
              <RootStack.Screen
                name="SoldSpot"
                component={SoldSpot}
                options={{
                  presentation: 'fullScreenModal',
                }}
              />
              <RootStack.Screen
                name="SpotDeletedDueToIssue"
                component={SpotDeletedDueToIssue}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="BookSpot"
                component={BookSpot}
                options={{
                  presentation: 'fullScreenModal',
                }}
              />
              <RootStack.Screen
                name="Locate"
                component={Locate}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="Negotiate"
                component={Negotiate}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="RespondToSuggestedPrice"
                component={RespondToSuggestedPrice}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="BookWithPayPal"
                component={BookWithPayPal}
                options={{
                  presentation: 'modal',
                  gestureEnabled: payPalSheetDismissable,
                }}
              />
              <RootStack.Screen
                name="Edit"
                component={EditOffer}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="TransactionSuccess"
                component={TransactionSuccess}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="Contact"
                component={Contact}
                options={{
                  presentation: 'modal',
                }}
              />
              <RootStack.Screen
                name="Transactions"
                component={Transactions}
                options={{
                  headerBackTitleVisible: false,
                  headerTintColor: 'black',
                  headerShown: true,
                }}
              />
            </RootStack.Navigator>
          </NavigationContainer>
        </LocationProvider>
      </StripeProvider>
    </PaperProvider>
  );
}

function BottomTabs() {
  const {user} = useAuth();
  const navigation = useNavigation();
  useHandlePushNotification();

  function withAuth(targetScreen: string) {
    return {
      tabPress: (event: any) => {
        if (!user) {
          event.preventDefault();
          navigation.navigate('LoginFlow', {targetScreen});
        }
      },
    };
  }

  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'black',
      }}>
      <BottomTab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: SearchIcon,
          headerShown: true,
          title: 'Available Spots',
          tabBarLabel: 'Search',
        }}
      />
      <BottomTab.Screen
        name="Offer"
        component={OfferScreen}
        listeners={withAuth('Offer')}
        options={{
          tabBarIcon: OfferIcon,
        }}
      />
      <BottomTab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={withAuth('Profile')}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </BottomTab.Navigator>
  );
}

interface TabBarIconProps {
  color: string;
  size: number;
}

const SearchIcon = ({color, size}: TabBarIconProps) => (
  <MaterialCommunityIcons name="magnify" color={color} size={size} />
);
const OfferIcon = ({color, size}: TabBarIconProps) => (
  <MaterialCommunityIcons
    name="plus-circle-outline"
    color={color}
    size={size}
  />
);
const ProfileIcon = ({color, size}: TabBarIconProps) => (
  <MaterialCommunityIcons name="account-outline" color={color} size={size} />
);

const WhiteBackground = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
  },
};

const TaqoTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'black',
    accent: '#FF6347',
    background: '#f3f3f3',
    surfaceVariant: '#f3f3f3',
  },
  roundness: 2,
};

export default App;
