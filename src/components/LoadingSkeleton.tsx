import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useApp } from '../context/AppContext';

export const LoadingSkeleton: React.FC = () => {
  const { colors } = useApp();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(key => (
        <View
          key={key}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.circle, { backgroundColor: colors.surfaceSubtle }]} />
            <View style={[styles.barShort, { backgroundColor: colors.surfaceSubtle }]} />
          </View>
          {/* Body */}
          <View style={styles.body}>
            <View style={[styles.poster, { backgroundColor: colors.surfaceSubtle }]} />
            <View style={styles.details}>
              <View style={[styles.barTime, { backgroundColor: colors.surfaceSubtle }]} />
              <View style={[styles.barTitle, { backgroundColor: colors.surfaceSubtle }]} />
              <View style={[styles.barDesc, { backgroundColor: colors.surfaceSubtle }]} />
              <View style={[styles.barBtn, { backgroundColor: colors.surfaceSubtle }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  circle: {
    width: 28,
    height: 20,
    borderRadius: 4,
  },
  barShort: {
    width: 90,
    height: 14,
    borderRadius: 4,
  },
  body: {
    flexDirection: 'row',
    gap: 12,
  },
  poster: {
    width: 76,
    height: 108,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  barTime: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
  barTitle: {
    width: '90%',
    height: 16,
    borderRadius: 4,
  },
  barDesc: {
    width: '70%',
    height: 12,
    borderRadius: 4,
  },
  barBtn: {
    width: 100,
    height: 24,
    borderRadius: 8,
    marginTop: 4,
  },
});
