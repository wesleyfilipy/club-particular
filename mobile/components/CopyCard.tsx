import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { LuxuryButton } from './LuxuryButton';
import { Copy, Check } from 'lucide-react-native';
import { CopySet } from '../store/useOffersStore';

interface CopyCardProps {
  copySet: CopySet;
}

export const CopyCard: React.FC<CopyCardProps> = ({ copySet }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Headline */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Headline Principal</Text>
          <LuxuryButton
            title={copiedField === 'headline' ? 'Copiado!' : 'Copiar Texto'}
            onPress={() => copyToClipboard(copySet.headline, 'headline')}
            variant={copiedField === 'headline' ? 'gold' : 'outline'}
            icon={
              copiedField === 'headline' ? (
                <Check size={14} color={COLORS.textDark} />
              ) : (
                <Copy size={14} color={COLORS.gold} />
              )
            }
            style={styles.smallBtn}
            textStyle={styles.smallBtnText}
          />
        </View>
        <Text style={styles.contentBox}>{copySet.headline}</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Descrição / Subheadline</Text>
          <LuxuryButton
            title={copiedField === 'description' ? 'Copiado!' : 'Copiar Texto'}
            onPress={() => copyToClipboard(copySet.description, 'description')}
            variant={copiedField === 'description' ? 'gold' : 'outline'}
            icon={
              copiedField === 'description' ? (
                <Check size={14} color={COLORS.textDark} />
              ) : (
                <Copy size={14} color={COLORS.gold} />
              )
            }
            style={styles.smallBtn}
            textStyle={styles.smallBtnText}
          />
        </View>
        <Text style={styles.contentBox}>{copySet.description}</Text>
      </View>

      {/* Textos para Anúncios (Ad Body) */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Texto do Anúncio (Copy Completa)</Text>
          <LuxuryButton
            title={copiedField === 'body' ? 'Copiado!' : 'Copiar Texto'}
            onPress={() => copyToClipboard(copySet.ad_body, 'body')}
            variant={copiedField === 'body' ? 'gold' : 'outline'}
            icon={
              copiedField === 'body' ? (
                <Check size={14} color={COLORS.textDark} />
              ) : (
                <Copy size={14} color={COLORS.gold} />
              )
            }
            style={styles.smallBtn}
            textStyle={styles.smallBtnText}
          />
        </View>
        <Text style={styles.contentBox}>{copySet.ad_body}</Text>
      </View>

      {/* CTA */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Chamada para Ação (CTA)</Text>
          <LuxuryButton
            title={copiedField === 'cta' ? 'Copiado!' : 'Copiar Texto'}
            onPress={() => copyToClipboard(copySet.cta, 'cta')}
            variant={copiedField === 'cta' ? 'gold' : 'outline'}
            icon={
              copiedField === 'cta' ? (
                <Check size={14} color={COLORS.textDark} />
              ) : (
                <Copy size={14} color={COLORS.gold} />
              )
            }
            style={styles.smallBtn}
            textStyle={styles.smallBtnText}
          />
        </View>
        <Text style={styles.ctaBox}>{copySet.cta}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  section: {
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    color: COLORS.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  smallBtn: {
    height: 32,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  smallBtnText: {
    fontSize: 12,
  },
  contentBox: {
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  ctaBox: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
});
