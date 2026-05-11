import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gradientStyle, ui, shadow } from '../../lib/ui';

function iconFor(key) {
  switch (key) {
    case 'home':
      return 'H';
    case 'search':
      return 'S';
    case 'bell':
      return 'A';
    case 'heart':
      return 'F';
    case 'user':
      return 'P';
    default:
      return '•';
  }
}

export default function BottomNav({ tabs, activeKey, onChange }) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            onPress={() => onChange(tab.key)}
          style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{iconFor(tab.icon)}</Text>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: ui.colors.surfaceGlass,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...shadow(1),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: ui.radius.lg,
  },
  itemActive: {
    ...gradientStyle('primary'),
  },
  itemPressed: {
    transform: [{ scale: 0.98 }],
  },
  icon: {
    color: '#98A2B3',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  iconActive: {
    color: '#FFFFFF',
  },
  label: {
    color: '#98A2B3',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
