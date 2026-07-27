import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { DownloadCloud, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { LuxuryButton } from './LuxuryButton';

interface DownloadProgressModalProps {
  visible: boolean;
  fileName: string;
  progressPercent: number; // 0 to 100
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  isFinished: boolean;
  error?: string;
  onClose: () => void;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  visible,
  fileName,
  progressPercent,
  totalBytesWritten,
  totalBytesExpectedToWrite,
  isFinished,
  error,
  onClose,
}) => {
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const writtenFormatted = formatBytes(totalBytesWritten);
  const totalFormatted = totalBytesExpectedToWrite > 0 ? formatBytes(totalBytesExpectedToWrite) : '2.3 GB';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {isFinished ? (
            <View style={styles.iconCircleSuccess}>
              <CheckCircle2 size={40} color={COLORS.success} />
            </View>
          ) : error ? (
            <View style={styles.iconCircleError}>
              <AlertCircle size={40} color={COLORS.error} />
            </View>
          ) : (
            <View style={styles.iconCircleProgress}>
              <DownloadCloud size={40} color={COLORS.gold} />
            </View>
          )}

          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>

          {isFinished ? (
            <Text style={styles.statusSuccess}>Download concluído com sucesso.</Text>
          ) : error ? (
            <Text style={styles.statusError}>{error}</Text>
          ) : (
            <Text style={styles.statusProgress}>Transferindo do Cloudflare R2 em alta velocidade...</Text>
          )}

          {/* Detailed Progress Bar */}
          {!error && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.fill,
                  { width: `${progressPercent}%` },
                  isFinished && { backgroundColor: COLORS.success },
                ]}
              />
            </View>
          )}

          {!error && (
            <View style={styles.statsRow}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
              <Text style={styles.bytesText}>
                {isFinished ? totalFormatted : `${writtenFormatted} / ${totalFormatted}`}
              </Text>
            </View>
          )}

          {(isFinished || error) && (
            <LuxuryButton
              title="Fechar"
              onPress={onClose}
              variant="gold"
              style={styles.closeBtn}
            />
          )}
        </View>
      </View>
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
  card: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  iconCircleProgress: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircleSuccess: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircleError: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statusProgress: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  statusSuccess: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  statusError: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  percentText: {
    color: COLORS.goldLight,
    fontSize: 15,
    fontWeight: '800',
  },
  bytesText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});
