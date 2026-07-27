import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface LuxuryCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({
  children,
  style,
  elevated = false,
}) => {
  return (
    <View
      style={[
        styles.card,
        elevated ? styles.elevated : styles.standard,
        SHADOWS.card,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  standard: {
    backgroundColor: COLORS.surface,
  },
  elevated: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.goldDark,
  },
});
