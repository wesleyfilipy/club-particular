import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface LuxuryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  title,
  onPress,
  variant = 'gold',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  if (variant === 'gold') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[SHADOWS.goldGlow, style]}
      >
        <LinearGradient
          colors={COLORS.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, disabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textDark} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.textGold, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, styles.outline, style]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.textOutline, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, styles.danger, style]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.text} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.textDanger, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, styles.ghost, style]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.goldLight} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.textGhost, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  textGold: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: COLORS.goldLight,
    fontSize: 16,
    fontWeight: '600',
  },
  textDanger: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  textGhost: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
