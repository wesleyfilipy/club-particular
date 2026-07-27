import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOffersStore, Offer } from '../../store/useOffersStore';
import { Header } from '../../components/Header';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Search, Gift, ChevronRight, DollarSign, Tag, Play } from 'lucide-react-native';

export default function OffersGridScreen() {
  const router = useRouter();
  const {
    offers,
    categories,
    selectedCategory,
    searchQuery,
    fetchOffers,
    setSelectedCategory,
    setSearchQuery,
  } = useOffersStore();

  useEffect(() => {
    fetchOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    const matchesCategory = selectedCategory ? offer.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const renderOfferItem = ({ item }: { item: Offer }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/(tabs)?offerId=${item.id}`)}
      >
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          <View style={styles.logoBadge}>
            <Image source={{ uri: item.logo_url }} style={styles.logoImage} />
          </View>
          <View style={styles.commissionTag}>
            <DollarSign size={14} color={COLORS.textDark} />
            <Text style={styles.commissionText}>{item.commission}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.offerName}>{item.name}</Text>
          <Text style={styles.offerDesc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.vslPill}>
              <Play size={12} color={COLORS.gold} />
              <Text style={styles.vslPillText}>VSL 4K Disponível</Text>
            </View>

            <View style={styles.actionRow}>
              <Text style={styles.accessText}>Ver Detalhes</Text>
              <ChevronRight size={16} color={COLORS.gold} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SubscriptionGate>
      <View style={styles.container}>
        <Header subtitle="Catálogo Completo de Ofertas Premium" />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar oferta, nicho ou palavra-chave..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Bar */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            <TouchableOpacity
              style={[styles.catPill, selectedCategory === null && styles.catPillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Tag size={12} color={selectedCategory === null ? COLORS.textDark : COLORS.gold} />
              <Text style={[styles.catText, selectedCategory === null && styles.catTextActive]}>
                Todas as Ofertas
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Offers Grid */}
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SubscriptionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    marginLeft: SPACING.xs,
  },
  categoriesWrapper: {
    marginBottom: SPACING.sm,
  },
  catScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  catPillActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  catText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catTextActive: {
    color: COLORS.textDark,
    fontWeight: '800',
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardImageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  logoBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  commissionTag: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  commissionText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  cardBody: {
    padding: SPACING.md,
  },
  offerName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  offerDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.sm,
  },
  vslPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vslPillText: {
    color: COLORS.goldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
  },
});
