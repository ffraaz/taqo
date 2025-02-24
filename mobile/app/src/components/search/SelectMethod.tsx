import React from 'react';
import {Image, Platform, Pressable, StyleSheet, View} from 'react-native';
import {RadioButton, Text} from 'react-native-paper';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import globalStyles from '../../utils/styles';

interface SelectMethodProps {
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  isPlatformPayAvailable: boolean;
}

const SelectMethod = ({
  paymentMethod,
  setPaymentMethod,
  isPlatformPayAvailable,
}: SelectMethodProps) => {
  const iOS = Platform.OS === 'ios';

  return (
    <RadioButton.Group
      onValueChange={value => setPaymentMethod(value)}
      value={paymentMethod}>
      {isPlatformPayAvailable && (
        <PaymentOption
          label={iOS ? 'Apple Pay' : 'Google Pay'}
          value="platform_pay"
          icon={
            iOS ? (
              <FontAwesome5 name={'apple-pay'} size={20} />
            ) : (
              <Image
                source={require('../../assets/google_pay.png')}
                style={styles.googlePayMark}
              />
            )
          }
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      )}
      <PaymentOption
        label="Credit Card"
        value="credit_card"
        icon={
          <MaterialCommunityIcons
            name={'credit-card-outline'}
            size={20}
            color={'black'}
          />
        }
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      <PaymentOption
        label="PayPal"
        value="paypal"
        icon={
          iOS ? (
            <FontAwesome5 name={'paypal'} size={20} />
          ) : (
            <Image
              source={require('../../assets/paypal.png')}
              style={styles.payPalMark}
            />
          )
        }
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
    </RadioButton.Group>
  );
};

interface PaymentOptionProps {
  label: string;
  value: string;
  icon: JSX.Element;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
}

const PaymentOption = ({
  label,
  value,
  icon,
  paymentMethod,
  setPaymentMethod,
}: PaymentOptionProps) => {
  return (
    <Pressable style={styles.option} onPress={() => setPaymentMethod(value)}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={globalStyles.flex}>{label}</Text>
      <RadioButton.Android
        value={value}
        status={value === paymentMethod ? 'checked' : 'unchecked'}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingRight: 0,
  },
  iconContainer: {
    width: Platform.OS === 'ios' ? 40 : 50,
  },
  googlePayMark: {
    height: 20,
    width: 37.6,
  },
  payPalMark: {
    height: 17,
    width: 14.53,
  },
});

export default SelectMethod;
