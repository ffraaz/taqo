import React from 'react';
import {Button, Dialog, Portal, Text} from 'react-native-paper';

import globalStyles from '../../../utils/styles';

interface ConfirmEmailDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  paypalEmail: string;
}

const ConfirmEmailDialog = ({
  visible,
  onDismiss,
  onConfirm,
  paypalEmail,
}: ConfirmEmailDialogProps) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={globalStyles.whiteBackground}>
        <Dialog.Title>Confirm PayPal Email</Dialog.Title>
        <Dialog.Content>
          <Text>{paypalEmail}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" onPress={onConfirm}>
            Continue
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmEmailDialog;
