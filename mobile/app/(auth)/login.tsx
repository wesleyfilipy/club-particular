import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LuxuryInput } from '../../components/LuxuryInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Mail, Lock, Crown, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }
    setErrorMessage('');
    const result = await signIn(email, password);
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
        <Text style={styles.brandTitle}>CLUB PARTICULAR</Text>
        <Text style={styles.subtitle}>Acesso Privado & Plataforma VIP</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Entrar na sua conta</Text>

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

        <LuxuryInput
          label="E-mail de Membro"
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          icon={<Mail size={20} color={COLORS.gold} />}
        />

        <LuxuryInput
          label="Senha de Acesso"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={setPassword}
          icon={<Lock size={20} color={COLORS.gold} />}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <LuxuryButton
          title="Acessar Plataforma VIP"
          onPress={handleLogin}
          loading={isLoading}
          variant="gold"
          icon={<ArrowRight size={20} color={COLORS.textDark} />}
          style={styles.loginBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Ainda não possui uma assinatura?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>Cadastrar-se no Club</Text>
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
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    color: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    fontSize: 13,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
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
  registerLink: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
