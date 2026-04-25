import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActivityFeed from '../components/ActivityFeed';

const STORAGE_KEY = '@ahorroya:activities';

const DEFAULT_ACTIVITIES = [
  { id: '1', label: 'Compra supermercado', amount: '$-45.80' },
  { id: '2', label: 'Ahorro automático', amount: '$+20.00' },
  { id: '3', label: 'Pago transporte', amount: '$-7.50' },
];

export default function ResultsScreen() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const storedActivities = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedActivities) {
          setActivities(JSON.parse(storedActivities));
          return;
        }

        setActivities(DEFAULT_ACTIVITIES);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
      } catch (error) {
        setActivities(DEFAULT_ACTIVITIES);
      }
    };

    loadActivities();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Balance de ahorro</Text>
        <Text style={styles.summaryAmount}>$1,240.50</Text>
        <Text style={styles.summaryNote}>Este mes estás +12% por encima del objetivo.</Text>
      </View>

      <ActivityFeed activities={activities} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    color: '#D0D5DD',
    fontSize: 15,
  },
  summaryAmount: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryNote: {
    marginTop: 8,
    fontSize: 14,
    color: '#98A2B3',
  },
});
