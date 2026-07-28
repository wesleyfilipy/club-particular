import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/Header';
import { LuxuryButton } from '../../components/LuxuryButton';
import { ConfirmModal } from '../../components/ConfirmModal';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { openStripeCustomerPortal, cancelStripeSubscriptionMobile } from '../../services/stripe';
import {
  User,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  FileText,
  HelpCircle,
  LogOut,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, isSubscribed, verifySubscription } = useAuthStore();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleConfirmCancelSubscription = async () => {
    setCancelModalVisible(false);
    if (!user) return;
    try {
      const res = await cancelStripeSubscriptionMobile(user.id, user.email);
      await verifySubscription();
      Alert.alert('Assinatura Cancelada', res.message);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível cancelar a assinatura.');
    }
  };

  const handleOpenStripePortal = async () => {
    setCancelModalVisible(false);
    try {
      await openStripeCustomerPortal();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível abrir o portal de assinaturas.');
    }
  };

  const handleRestorePurchases = async () => {
    setRestoreLoading(true);
    await verifySubscription();
    setRestoreLoading(false);
    Alert.alert('Sucesso', 'Sua assinatura e permissões foram atualizadas!');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Header subtitle="Gerenciamento de Conta & Assinatura" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
            }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name || ' Gabriel Siqueira'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'membro@clubparticular.com'}</Text>
            <View style={styles.statusBadge}>
              <ShieldCheck size={12} color={COLORS.textDark} />
              <Text style={styles.statusBadgeText}>
                {isSubscribed ? 'ASSINATURA STRIPE ATIVA' : 'ASSINATURA INATIVA'}
              </Text>
            </View>
          </View>
        </View>

        {/* Options Menu List */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MINHA CONTA</Text>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <User size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Meu Perfil</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Lock size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Alterar Senha</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Mail size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>E-mail de Cadastro</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleRestorePurchases}
          >
            <View style={styles.menuItemLeft}>
              <RefreshCw size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Restaurar Compras</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>SUPORTE & TERMOS</Text>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://clubparticular.com/privacidade')}
          >
            <View style={styles.menuItemLeft}>
              <ShieldCheck size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Política de Privacidade</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://clubparticular.com/termos')}
          >
            <View style={styles.menuItemLeft}>
              <FileText size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Termos de Uso</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://wa.me/5511999999999')}
          >
            <View style={styles.menuItemLeft}>
              <HelpCircle size={20} color={COLORS.gold} />
              <Text style={styles.menuItemText}>Suporte VIP no WhatsApp</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Big Cancel Subscription Button Section */}
        <View style={styles.dangerSection}>
          <LuxuryButton
            title="CANCELAR ASSINATURA STRIPE"
            onPress={() => setCancelModalVisible(true)}
            variant="danger"
            icon={<AlertOctagon size={20} color={COLORS.error} />}
            style={styles.bigCancelBtn}
          />

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={18} color={COLORS.textSecondary} />
            <Text style={styles.signOutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal for 1-click Stripe cancel */}
      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancelar Assinatura VIP"
        message="Tem certeza que deseja cancelar sua assinatura mensal do Stripe? O cancelamento será processado instantaneamente e nenhuma nova cobrança será realizada no seu cartão."
        confirmText="Sim, Cancelar Assinatura"
        cancelText="Voltar"
        isDanger
        onConfirm={handleConfirmCancelSubscription}
        onCancel={() => setCancelModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    color: COLORS.textDark,
    fontSize: 9,
    fontWeight: '900',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.goldLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dangerSection: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  bigCancelBtn: {
    width: '100%',
    height: 56,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
