import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface LuxuryInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const LuxuryInput: React.FC<LuxuryInputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textSecondary} />
            ) : (
              <Eye size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  inputContainer: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surfaceElevated,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
