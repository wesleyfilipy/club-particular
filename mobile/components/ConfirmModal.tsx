import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { LuxuryButton } from './LuxuryButton';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <View style={[styles.iconCircle, isDanger && styles.iconDanger]}>
                <AlertTriangle size={32} color={isDanger ? COLORS.error : COLORS.gold} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonRow}>
                <LuxuryButton
                  title={cancelText}
                  onPress={onCancel}
                  variant="ghost"
                  style={styles.btnHalf}
                />
                <LuxuryButton
                  title={confirmText}
                  onPress={onConfirm}
                  variant={isDanger ? 'danger' : 'gold'}
                  style={styles.btnHalf}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dialog: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  btnHalf: {
    flex: 1,
  },
});
