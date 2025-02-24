import storage, {FirebaseStorageTypes} from '@react-native-firebase/storage';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';

import {useAuth} from '../../utils/AuthProvider';
import {getUserLocation} from '../../utils/LocationProvider';
import type {
  BottomTabsScreenProps,
  CreateOfferStackParamList,
  Location,
} from '../../utils/types.ts';
import PayPalForm from './create/PayPalForm';
import SelectPrice from './create/SelectPrice';
import SelectProgress from './create/SelectProgress';
import SelectQueue from './create/SelectQueue';
import ExplainSelfie from './create/Selfie/ExplainSelfie';
import TakeSelfie from './create/Selfie/TakeSelfie';
import Summary from './create/Summary';

const Stack = createNativeStackNavigator<CreateOfferStackParamList>();

interface CreateOfferProps {
  navigation: BottomTabsScreenProps<'Offer'>['navigation'];
  route: BottomTabsScreenProps<'Offer'>['route'];
  setPublishedBannerVisible: (visible: boolean) => void;
}

const CreateOffer = ({
  navigation,
  route,
  setPublishedBannerVisible,
}: CreateOfferProps) => {
  const [price, setPrice] = useState('');
  const [progress, setProgress] = useState(50);
  const [queueName, setQueueName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isQueueNameFocused, setIsQueueNameFocused] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const {user} = useAuth();
  const [uploadError, setUploadError] = useState(false);
  const [retryUpload, setRetryUpload] = useState(false);
  const [refreshLocation, setRefreshLocation] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getUserLocation();
      setUserLocation(location);
    };
    fetchLocation().catch(() => {});
  }, [refreshLocation]);

  useEffect(() => {
    if (photoUri) {
      let task: FirebaseStorageTypes.Task;
      let cancelled = false;
      const uploadPhoto = async () => {
        setDownloadUrl(null);
        setUploadError(false);
        const now = new Date();
        const filename = `${user.uid}/${now.toISOString()}.jpg`;
        const storageRef = storage().ref(filename);
        task = storageRef.putFile(photoUri);
        await task;
        const downloadUrl_ = await storageRef.getDownloadURL();
        setDownloadUrl(downloadUrl_);
      };
      uploadPhoto().catch(error => {
        if (!cancelled) {
          setUploadError(true);
          console.error('Error uploading image:', error);
        }
      });
      return () => {
        cancelled = true;
        if (task) {
          try {
            task.cancel().catch(() => {});
          } catch (error) {
            console.error('Error cancelling upload:', error);
          }
        }
      };
    }
  }, [photoUri, user, retryUpload]);

  useEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'SelectQueue';
    if (routeName === 'SelectQueue' && !isQueueNameFocused) {
      navigation.setOptions({tabBarStyle: {display: 'flex'}});
    } else {
      navigation.setOptions({
        tabBarStyle: {display: 'none'},
      });
    }
  }, [isQueueNameFocused, navigation, route]);

  const onQueueNameChange = (newQueueName: string) => {
    setQueueName(newQueueName);

    if (newQueueName === '') {
      setPrice('');
      setProgress(50);
      setPhotoUri(null);
    }
  };

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SelectQueue">
        {props => (
          <SelectQueue
            {...props}
            queueName={queueName}
            setQueueName={onQueueNameChange}
            setIsQueueNameFocused={setIsQueueNameFocused}
            refreshLocation={refreshLocation}
            setRefreshLocation={setRefreshLocation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SelectProgress">
        {props => (
          <SelectProgress
            {...props}
            progress={progress}
            setProgress={setProgress}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SelectPrice">
        {props => <SelectPrice {...props} price={price} setPrice={setPrice} />}
      </Stack.Screen>
      <Stack.Screen name="ExplainSelfie" component={ExplainSelfie} />
      <Stack.Screen
        name="TakeSelfie"
        options={{
          gestureEnabled: false,
        }}>
        {props => (
          <TakeSelfie
            {...props}
            photoUri={photoUri}
            setPhotoUri={setPhotoUri}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name={'PayPalForm'}>
        {props => <PayPalForm {...props} />}
      </Stack.Screen>
      <Stack.Screen name={'Summary'}>
        {props => (
          <Summary
            {...props}
            price={price}
            progress={progress}
            queueName={queueName}
            downloadUrl={downloadUrl}
            location={userLocation as Location}
            uploadError={uploadError}
            setRetryUpload={setRetryUpload}
            retryUpload={retryUpload}
            setPublishedBannerVisible={setPublishedBannerVisible}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default CreateOffer;
