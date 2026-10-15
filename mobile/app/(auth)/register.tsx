import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LuxuryInput } from '../../components/LuxuryInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Mail, Lock, User, Crown, CheckCircle } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }
    setErrorMessage('');
    const result = await signUp(fullName, email, password);
    if (result.error) {
      setErrorMessage(result.error);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.crownCircle}>
          <Crown size={36} color={COLORS.gold} />
        </View>
        <Text style={styles.brandTitle}>CRIAR CONTA VIP</Text>
        <Text style={styles.subtitle}>Crie sua conta no Escala Swipe (1 conta por e-mail)</Text>
      </View>

      <View style={styles.formCard}>
        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

        <LuxuryInput
          label="Nome Completo"
          placeholder="Gabriel Siqueira"
          value={fullName}
          onChangeText={setFullName}
          icon={<User size={20} color={COLORS.gold} />}
        />

        <LuxuryInput
          label="Seu E-mail"
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          icon={<Mail size={20} color={COLORS.gold} />}
        />

        <LuxuryInput
          label="Crie sua Senha"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={setPassword}
          icon={<Lock size={20} color={COLORS.gold} />}
        />

        <View style={styles.infoBox}>
          <CheckCircle size={18} color={COLORS.gold} />
          <Text style={styles.infoText}>
            Após o cadastro, você poderá ativar sua assinatura de R$ 100/mês para liberar o acesso.
          </Text>
        </View>

        <LuxuryButton
          title="Concluir Cadastro VIP"
          onPress={handleRegister}
          loading={isLoading}
          variant="gold"
          style={styles.registerBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já possui uma conta?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Fazer Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  brandTitle: {
    color: COLORS.goldLight,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  errorBanner: {
    color: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  registerBtn: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
