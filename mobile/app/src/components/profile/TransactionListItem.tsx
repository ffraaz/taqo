import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, TouchableHighlight, View} from 'react-native';
import {Card, Text} from 'react-native-paper';

import {useAuth} from '../../utils/AuthProvider';
import globalStyles from '../../utils/styles';
import type {Transaction} from '../../utils/types.ts';
import {formatPrice} from '../../utils/Utils';

interface TransactionListItemProps {
  transaction: Transaction;
}

const TransactionListItem = ({transaction}: TransactionListItemProps) => {
  const {user} = useAuth();
  const isBuyer = user.uid === transaction.buyerId;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const formatter = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const styles = StyleSheet.create({
    item: {
      marginHorizontal: 10,
      marginVertical: 5,
    },
    queueName: {
      fontWeight: 'bold',
      marginBottom: 5,
    },
    priceWrapper: {
      justifyContent: 'center',
    },
    price: {
      backgroundColor: isBuyer ? '#e3e3e3' : '#98FB98',
      borderRadius: 5,
      padding: 5,
    },
  });

  return (
    <TouchableHighlight
      underlayColor="white"
      onPress={() => {
        if (isBuyer) {
          navigation.navigate('TransactionSuccess', {
            spotId: transaction.spotId,
          });
        }
      }}
      style={styles.item}>
      <View>
        <Card style={globalStyles.whiteBackground}>
          <Card.Content>
            <View style={globalStyles.row}>
              <View>
                <Text style={styles.queueName}>{transaction.queueName}</Text>
                <Text>{formatter.format(transaction.createdAt.toDate())}</Text>
              </View>
              <View style={styles.priceWrapper}>
                <View style={styles.price}>
                  <Text>
                    {formatPrice(
                      isBuyer
                        ? transaction.buyerPrice
                        : transaction.sellerPrice,
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </TouchableHighlight>
  );
};

export default TransactionListItem;
