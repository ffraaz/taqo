import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Card, Text} from 'react-native-paper';

import globalStyles from '../../utils/styles.ts';
import Badge from './Badge';
import ContactMail from './ContactMail';
import VerticallyCenteringView from './VerticallyCenteringView';

interface BookingSuccessProps {
  downloadUrl: string;
}

const BookingSuccess = ({downloadUrl}: BookingSuccessProps) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={globalStyles.whiteBackground}>
        <Card.Title title="Success" titleVariant="titleLarge" />
        <Card.Content>
          <Text>
            The spot is yours. Show this badge to the seller as proof of the
            successful transaction. Please don't start a fight if other line
            standers complain about the exchange. Instead, contact us at{' '}
            <ContactMail />. We will refund your payment if the exchange is
            unsuccessful.
          </Text>
        </Card.Content>
      </Card>
      <VerticallyCenteringView style={styles.badge}>
        <Badge downloadUrl={downloadUrl} />
      </VerticallyCenteringView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    marginTop: 30,
  },
  badge: {
    marginVertical: 40,
  },
});

export default BookingSuccess;
