import firestore from '@react-native-firebase/firestore';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {Button, Portal} from 'react-native-paper';

import globalStyles from '../../utils/styles';
import {Spot} from '../../utils/types.ts';
import BottomBanner from '../commons/BottomBanner.tsx';
import ConfirmDialog from '../commons/ConfirmDialog.tsx';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import SpotCard from '../commons/SpotCard';
import Warning from '../commons/Warning';

interface ActiveOfferProps {
  spot: Spot;
  editable: boolean;
  setDeletedBannerVisible: (visible: boolean) => void;
}

const ActiveOffer = ({
  spot,
  editable,
  setDeletedBannerVisible,
}: ActiveOfferProps) => {
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [updatedBannerVisible, setUpdatedBannerVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async () => {
    try {
      setIsDeleting(true);
      const db = firestore();
      await db.runTransaction(async transaction => {
        const spotRef = db.collection('spots').doc(spot.id);
        const spotSnapshot = await transaction.get(spotRef);

        if (
          spotSnapshot.exists &&
          spotSnapshot.data()?.status === 'available'
        ) {
          transaction.update(spotRef, {status: 'deleted'});
        } else {
          Alert.alert(
            'Error',
            'The spot cannot be deleted, as it is currently being booked.',
          );
          console.log(
            'Document is not available for deletion (status not "available")',
          );
        }
      });
      setDeletedBannerVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Delete failed. Please try again later.');
      console.error('Error updating Firestore document status:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenWrapper style={globalStyles.flex}>
      <View
        style={[
          globalStyles.flex,
          globalStyles.marginHorizontal,
          styles.container,
        ]}>
        <SpotCard spot={spot} isSeller={true} />
        {editable && (
          <View style={[globalStyles.row, styles.buttons]}>
            <Button
              mode="contained"
              onPress={() =>
                navigation.navigate('Edit', {spot, setUpdatedBannerVisible})
              }
              disabled={!editable}>
              Edit
            </Button>
            <Button
              mode="contained"
              onPress={() => setIsDeleteDialogVisible(true)}
              buttonColor="red"
              disabled={!editable}>
              Delete
            </Button>
          </View>
        )}

        {!editable && (
          <Warning
            darkBackground={true}
            warningText="The spot is currently being booked and can thus not be edited."
            style={styles.warning}
          />
        )}
      </View>
      <Portal>
        <ConfirmDialog
          visible={isDeleteDialogVisible}
          title={'Confirm Deletion'}
          text="Are you sure you want to delete this spot?"
          confirmButtonText={'Delete'}
          onDismiss={() => setIsDeleteDialogVisible(false)}
          onConfirm={() => {
            setIsDeleteDialogVisible(false);
            onDelete().catch(() => {});
          }}
          loading={isDeleting}
        />
      </Portal>
      <BottomBanner
        text={'Spot updated successfully.'}
        visible={updatedBannerVisible}
        setVisible={setUpdatedBannerVisible}
        success={true}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },
  buttons: {
    marginTop: 20,
  },
  warning: {
    marginTop: 20,
  },
});

export default ActiveOffer;
