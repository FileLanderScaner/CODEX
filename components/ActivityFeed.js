import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function ActivityFeed({ activities = [] }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.heading}>Ultimos precios agregados</Text>
      <FlatList
        data={activities.slice(0, 5)}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text selectable style={styles.label}>{item.displayName}</Text>
              <Text selectable style={styles.meta}>{item.store} · {item.neighborhood}</Text>
            </View>
            <Text selectable style={styles.price}>${item.price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text selectable style={styles.empty}>Agrega el primer precio y ayuda a otros a ahorrar.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  heading: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    color: '#101828',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EC',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 15,
    color: '#344054',
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
    color: '#667085',
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: '#027A48',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontSize: 14,
    color: '#667085',
    paddingVertical: 6,
  },
});
