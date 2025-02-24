import React from 'react';
import {Button, Dialog, Text} from 'react-native-paper';

import globalStyles from '../../utils/styles.ts';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  text: string;
  confirmButtonText?: string;
  onDismiss: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmDialog = ({
  visible,
  title,
  text,
  confirmButtonText = 'Confirm',
  onDismiss,
  onConfirm,
  loading,
}: ConfirmDialogProps) => {
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      dismissable={!loading}
      style={globalStyles.whiteBackground}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Text>{text}</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={loading}>
          Cancel
        </Button>
        <Button
          textColor="red"
          onPress={onConfirm}
          loading={loading}
          disabled={loading}>
          {confirmButtonText}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default ConfirmDialog;
