import firestore, { // @ts-ignore
  or, // @ts-ignore
  orderBy, // @ts-ignore
  query, // @ts-ignore
  where,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import React, {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import type {Transaction} from '../../utils/types.ts';
import ScreenWrapper from '../commons/ScreenWrapper.tsx';
import VerticallyCenteringView from '../commons/VerticallyCenteringView';
import TransactionListItem from './TransactionListItem';

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const {user} = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const transactionsRef = firestore().collection('transactions');

    const transactionsQuery = query(
      transactionsRef,
      or(where('buyerId', '==', user.uid), where('sellerId', '==', user.uid)),
      where('status', 'in', [
        'charged_buyer',
        'payout_succeeded',
        'payout_failed',
      ]),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = transactionsQuery.onSnapshot(
      (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const updatedTransactions = snapshot.docs.map(
          (doc: FirebaseFirestoreTypes.DocumentSnapshot) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Transaction),
        );
        setTransactions(updatedTransactions);
        setIsLoading(false);
      },
      (error: Error) => {
        Alert.alert(
          'Error',
          'Failed to fetch transactions. Please try again later.',
        );
        console.error('Failed to fetch transactions: ', error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <VerticallyCenteringView>
          <ActivityIndicator />
        </VerticallyCenteringView>
      </ScreenWrapper>
    );
  }

  if (transactions.length === 0) {
    return (
      <ScreenWrapper>
        <VerticallyCenteringView>
          <Text>No past transactions</Text>
        </VerticallyCenteringView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={transactions}
        renderItem={({item}) => <TransactionListItem transaction={item} />}
        keyExtractor={(item: Transaction) => item.id}
        style={styles.list}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
  },
});

export default TransactionsScreen;
