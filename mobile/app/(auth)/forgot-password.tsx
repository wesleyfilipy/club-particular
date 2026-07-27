import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LuxuryInput } from '../../components/LuxuryInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { supabase } from '../../services/supabase';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMsg('Informe o e-mail cadastrado.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.gold} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <KeyRound size={36} color={COLORS.gold} />
        </View>
        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>
          Enviaremos um link de redefinição para o seu e-mail cadastrado
        </Text>
      </View>

      <View style={styles.formCard}>
        {success ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={32} color={COLORS.success} />
            <Text style={styles.successTitle}>E-mail enviado!</Text>
            <Text style={styles.successText}>
              Verifique sua caixa de entrada para criar uma nova senha.
            </Text>
            <LuxuryButton
              title="Voltar ao Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="gold"
              style={{ width: '100%', marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <>
            {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}

            <LuxuryInput
              label="E-mail do Cadastrado"
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={COLORS.gold} />}
            />

            <LuxuryButton
              title="Enviar Link de Recuperação"
              onPress={handleResetPassword}
              loading={loading}
              variant="gold"
              style={{ width: '100%', marginTop: SPACING.sm }}
            />
          </>
        )}
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  backText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
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
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
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
  successBox: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  successTitle: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
