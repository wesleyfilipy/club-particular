import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { LuxuryButton } from './LuxuryButton';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Lock, Crown, RefreshCw } from 'lucide-react-native';
import { openStripeCheckout } from '../services/stripe';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { isSubscribed, verifySubscription, isLoading } = useAuthStore();

  if (isSubscribed) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        <View style={styles.iconCircle}>
          <Lock size={42} color={COLORS.gold} />
        </View>

        <View style={styles.titleRow}>
          <Crown size={24} color={COLORS.gold} />
          <Text style={styles.title}>Área Exclusiva VIP</Text>
        </View>

        <Text style={styles.description}>
          Sua assinatura do <Text style={{ color: COLORS.gold }}>Club Particular (R$ 0,01/mês)</Text> está inativa ou expirada.
        </Text>

        <Text style={styles.subtext}>
          Assine para liberar acesso completo a Ofertas VSL, Downloads de Criativos, Biblioteca de Anúncios e Chat Privado de Membros.
        </Text>

        <View style={styles.priceTag}>
          <Text style={styles.priceText}>R$ 0,01</Text>
          <Text style={styles.pricePeriod}> / mês</Text>
        </View>

        <LuxuryButton
          title="Assinar Agora no Stripe"
          onPress={openStripeCheckout}
          variant="gold"
          style={styles.actionBtn}
        />

        <LuxuryButton
          title="Verificar Minha Assinatura"
          onPress={verifySubscription}
          variant="outline"
          loading={isLoading}
          icon={<RefreshCw size={18} color={COLORS.gold} />}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  contentCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  subtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  priceText: {
    color: COLORS.goldLight,
    fontSize: 28,
    fontWeight: '900',
  },
  pricePeriod: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  actionBtn: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
});
