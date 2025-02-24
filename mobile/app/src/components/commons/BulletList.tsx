import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';

import globalStyles from '../../utils/styles.ts';

interface BulletListProps {
  items: string[];
}

const BulletList = ({items}: BulletListProps) => {
  return (
    <View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <View style={globalStyles.flex}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        </View>
      ))}
      <View style={styles.finishList} />
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletPoint: {
    width: 15,
    fontSize: 16,
  },
  itemText: {
    fontSize: 16,
  },
  finishList: {
    marginBottom: -10,
  },
});

export default BulletList;
