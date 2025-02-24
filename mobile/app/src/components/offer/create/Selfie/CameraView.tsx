import React, {useEffect, useRef, useState} from 'react';
import {Alert, Platform, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native-paper';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import globalStyles from '../../../../utils/styles';
import {PermissionError} from '../../../commons/PermissionError';
import ShutterButton from './ShutterButton';

interface CameraViewProps {
  setPhotoUri: (uri: string) => void;
  onCancel: () => void;
  setShowCamera: (show: boolean) => void;
}

const CameraView = ({
  setPhotoUri,
  onCancel,
  setShowCamera,
}: CameraViewProps) => {
  const cameraRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  const pathPrefix = Platform.OS === 'ios' ? '' : 'file://';
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setInitialized(true);
    }, 10);
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await (cameraRef.current as Camera).takePhoto();
        setPhotoUri(pathPrefix + photo.path);
        setShowCamera(false);
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to take photo.');
      }
    }
  };

  const onCancelLocal = () => {
    setIsCameraActive(false);
    setTimeout(() => {
      onCancel();
    }, 10);
  };

  if (device == null) {
    return null;
  }

  return (
    <View style={globalStyles.flex}>
      {hasPermission && (
        <Camera
          ref={cameraRef}
          device={device}
          isActive={isCameraActive}
          photo={true}
          style={initialized && globalStyles.flex}
          outputOrientation="preview"
        />
      )}
      {!hasPermission && (
        <PermissionError
          errorMessage="Please allow camera access in the system settings and try again."
          onRetry={requestPermission}
        />
      )}
      {initialized && (
        <View style={globalStyles.cameraButtonBar}>
          <TouchableOpacity
            onPress={onCancelLocal}
            style={globalStyles.cameraCancelButton}
            hitSlop={globalStyles.hitSlop}>
            <Text style={globalStyles.cameraButtonText}>Back</Text>
          </TouchableOpacity>
          {hasPermission && <ShutterButton onPress={takePhoto} />}
        </View>
      )}
    </View>
  );
};

export default CameraView;
