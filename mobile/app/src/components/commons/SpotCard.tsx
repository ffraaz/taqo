import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import globalStyles from '../../utils/styles';
import type {Spot} from '../../utils/types';
import {formatPrice} from '../../utils/Utils';
import VerticallyCenteringView from './VerticallyCenteringView';

interface SpotCardProps {
  spot: Spot;
  isSeller?: boolean;
  hidePrice?: boolean;
  color?: string;
  style?: object;
  children?: React.ReactNode;
}

const SpotCard = ({
  spot,
  isSeller = false,
  hidePrice = false,
  color = 'white',
  style = {},
  children,
}: SpotCardProps) => {
  const price = isSeller ? spot.sellerPrice : spot.buyerPrice;
  return (
    <View style={style}>
      <Card theme={{colors: {elevation: {level1: color}}}}>
        <Card.Content>
          <View style={globalStyles.row}>
            <View>
              <Text style={styles.topRowText}>{spot.queueName}</Text>
              <Text>
                <MaterialCommunityIcons name="map-marker" size={14} />{' '}
                {formatDistance(spot)}
              </Text>
            </View>
            <View style={styles.rightColumn}>
              {!hidePrice && (
                <View style={styles.rightColumn}>
                  <Text style={styles.topRowText}>{formatPrice(price)}</Text>
                  <Text>Top {toPercentage(spot.progress)}% of line</Text>
                </View>
              )}
              {hidePrice && (
                <VerticallyCenteringView>
                  <MaterialCommunityIcons
                    name="square-edit-outline"
                    size={25}
                    color={'black'}
                  />
                </VerticallyCenteringView>
              )}
            </View>
          </View>
          {children}
        </Card.Content>
      </Card>
    </View>
  );
};

const toPercentage = (number: number) => {
  const rounded = number - (number % 10);
  return 100 - rounded;
};

function formatDistance(spot: Spot) {
  if (spot.distance < 1) {
    return `${Math.round(spot.distance * 1000)} m`;
  } else if (spot.distance < 10) {
    return `${spot.distance.toFixed(1)} km`;
  } else {
    return `${Math.round(spot.distance)} km`;
  }
}

const styles = StyleSheet.create({
  topRowText: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
});

export default SpotCard;
