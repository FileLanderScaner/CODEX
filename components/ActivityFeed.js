import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function ActivityFeed({ activities = [] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Actividad reciente</Text>
      <FlatList
        data={activities}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay actividad todavía.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    elevation: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#101828',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EC',
  },
  label: {
    fontSize: 15,
    color: '#344054',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#12B76A',
  },
  empty: {
    fontSize: 14,
    color: '#667085',
    paddingVertical: 6,
  },
});
