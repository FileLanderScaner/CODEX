import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function AnimatedSection({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[styles.section, { opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
});
