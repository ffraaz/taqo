import React from 'react';
import {Platform, StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';

import {useLocation} from '../../utils/LocationProvider';
import VerticallyCenteringView from './VerticallyCenteringView';
import Warning from './Warning';

interface PermissionErrorProps {
  errorMessage: string | JSX.Element;
  onRetry: () => void;
}

export const PermissionError = ({
  errorMessage,
  onRetry,
}: PermissionErrorProps) => {
  return (
    <VerticallyCenteringView>
      <Warning warningText={errorMessage} style={styles.warning} />
      <Button mode="contained" onPress={onRetry} icon={'reload'}>
        Retry
      </Button>
    </VerticallyCenteringView>
  );
};

export const LocationError = () => {
  const {fetchLocation} = useLocation();
  return (
    <PermissionError
      errorMessage={
        <Text>
          Failed to obtain location. Please allow{' '}
          <Text style={styles.precise}>precise</Text> location access in the
          system settings and try again.
        </Text>
      }
      onRetry={fetchLocation}
    />
  );
};

const styles = StyleSheet.create({
  warning: {
    width: '70%',
    marginBottom: 20,
  },
  precise: {
    fontWeight: Platform.OS === 'ios' ? 'normal' : 'bold',
  },
});
