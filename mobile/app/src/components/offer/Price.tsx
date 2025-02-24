import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, TextInput} from 'react-native-paper';

interface PriceProps {
  price: string;
  setPrice: (price: string) => void;
  autofocus?: boolean;
  onSubmit?: () => void;
}

const Price = ({price, setPrice, autofocus = true, onSubmit}: PriceProps) => {
  const handlePriceChange = (text: string) => {
    let numericValue = text.replace(/[^0-9]/g, '');
    const num = parseInt(numericValue, 10);
    numericValue = isNaN(num) ? '' : num.toString();
    setPrice(numericValue);
  };

  const placeholderTextColor = '#C7C7CD';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        mode="flat"
        value={price}
        placeholder="0"
        onChangeText={handlePriceChange}
        placeholderTextColor={placeholderTextColor}
        inputMode="numeric"
        onSubmitEditing={onSubmit}
        autoFocus={autofocus}
      />
      <Text
        style={[
          styles.euroSign,
          {color: price ? 'black' : placeholderTextColor}, // eslint-disable-line react-native/no-inline-styles
        ]}>
        €
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 50,
    height: 90,
  },
  euroSign: {
    marginLeft: 20,
    fontSize: 50,
  },
});

export default Price;
