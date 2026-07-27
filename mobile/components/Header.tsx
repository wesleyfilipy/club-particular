import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { ShieldCheck, Crown } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user, isSubscribed } = useAuthStore();

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.brandRow}>
          <Crown size={22} color={COLORS.gold} />
          <Text style={styles.brandTitle}>CLUB PARTICULAR</Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : (
          <Text style={styles.subtitle}>Membros VIP</Text>
        )}
      </View>

      <View style={styles.userBadge}>
        {isSubscribed && (
          <View style={styles.vipTag}>
            <ShieldCheck size={12} color={COLORS.textDark} />
            <Text style={styles.vipTagText}>VIP ATIVO</Text>
          </View>
        )}
        <Image
          source={{
            uri:
              user?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          }}
          style={styles.avatar}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  brandTitle: {
    color: COLORS.goldLight,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vipTag: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vipTagText: {
    color: COLORS.textDark,
    fontSize: 10,
    fontWeight: '800',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
});
