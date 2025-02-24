import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import {Button, Card, Portal, Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import ConfirmDialog from '../components/commons/ConfirmDialog.tsx';
import ScreenWrapper from '../components/commons/ScreenWrapper.tsx';
import {useAuth} from '../utils/AuthProvider';
import globalStyles from '../utils/styles';
import {request} from '../utils/Utils';

const ProfileScreen = () => {
  const {user, signOut} = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      await request('delete_user', {}, user);
      signOut();
      setIsDeleteDialogVisible(false);
      navigation.navigate('Search');
      Alert.alert('Success', 'Your account has been deleted successfully.');
    } catch (error) {
      setIsDeleteDialogVisible(false);
      const errorMessage =
        (error as Error).message === 'ff_error/user_has_active_offer'
          ? 'You have active offers. Please delete them first.'
          : 'Failed to delete account. Please try again later.';
      setTimeout(() => {
        Alert.alert('Error', errorMessage);
      }, 400);
    } finally {
      setDeleting(false);
    }
  };

  if (user) {
    return (
      <ScreenWrapper>
        <SafeAreaView
          style={[
            globalStyles.marginHorizontal,
            styles.container,
            globalStyles.flex,
          ]}>
          <View style={styles.innerContainer}>
            <ListItem
              text={'Transactions'}
              icon={
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={20}
                  color={'black'}
                />
              }
              onPress={() => navigation.navigate('Transactions')}
            />
            <ListItem
              text={'Contact'}
              icon={
                <MaterialCommunityIcons
                  name="comment-question-outline"
                  size={20}
                  color={'black'}
                />
              }
              onPress={() => navigation.navigate('Contact')}
            />
          </View>
          <View>
            <Button
              onPress={() => {
                signOut();
                navigation.navigate('Search');
              }}>
              Sign out
            </Button>
            <Button
              textColor={'red'}
              style={styles.deleteButton}
              onPress={() => setIsDeleteDialogVisible(true)}>
              Delete account
            </Button>
          </View>
          <Portal>
            <ConfirmDialog
              visible={isDeleteDialogVisible}
              title={'Confirm Deletion'}
              text="Are you sure you want to permanently delete your account?"
              confirmButtonText={'Delete'}
              onDismiss={() => setIsDeleteDialogVisible(false)}
              onConfirm={deleteAccount}
              loading={deleting}
            />
          </Portal>
        </SafeAreaView>
      </ScreenWrapper>
    );
  } else {
    return null;
  }
};

interface ListItemProps {
  text: string;
  icon: JSX.Element;
  onPress: () => void;
}

const ListItem = ({text, icon, onPress}: ListItemProps) => {
  return (
    <TouchableHighlight underlayColor="white" onPress={onPress}>
      <Card style={[globalStyles.whiteBackground, styles.card]}>
        <Card.Content style={styles.cardContent}>
          {icon}
          <Text style={styles.listItemText}>{text}</Text>
        </Card.Content>
      </Card>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    marginBottom: 20,
  },
  container: {
    justifyContent: 'space-between',
  },
  innerContainer: {
    marginTop: 25,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    marginLeft: 10,
    fontSize: 17,
  },
  card: {
    marginVertical: 5,
  },
});

export default ProfileScreen;
