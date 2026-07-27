import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useOffersStore, Offer } from '../../store/useOffersStore';
import { Header } from '../../components/Header';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { LuxuryButton } from '../../components/LuxuryButton';
import { VSLPlayer } from '../../components/VSLPlayer';
import { CopyCard } from '../../components/CopyCard';
import { DownloadProgressModal } from '../../components/DownloadProgressModal';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import {
  Play,
  Download,
  Video,
  BookOpen,
  Globe,
  FileText,
  Copy,
  Users,
  DollarSign,
  ChevronRight,
} from 'lucide-react-native';
import { getSignedDownloadUrl, downloadFileWithProgress } from '../../services/downloader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SwipeOffersScreen() {
  const { offers, fetchOffers } = useOffersStore();
  const [downloadModal, setDownloadModal] = useState({
    visible: false,
    fileName: '',
    progress: 0,
    written: 0,
    expected: 0,
    isFinished: false,
    error: '',
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleDownloadVSL = async (vsl: any) => {
    try {
      setDownloadModal({
        visible: true,
        fileName: `${vsl.title}.mp4`,
        progress: 0,
        written: 0,
        expected: 2411724800, // 2.3 GB simulated default size
        isFinished: false,
        error: '',
      });

      const signedUrl = await getSignedDownloadUrl('vsl-videos', vsl.video_url);

      await downloadFileWithProgress(signedUrl, `${vsl.title}.mp4`, (prog) => {
        setDownloadModal((prev) => ({
          ...prev,
          progress: prog.progressPercent,
          written: prog.totalBytesWritten || prev.written,
          expected: prog.totalBytesExpectedToWrite || prev.expected,
          isFinished: prog.isFinished,
          error: prog.error || '',
        }));
      });
    } catch (err: any) {
      setDownloadModal((prev) => ({
        ...prev,
        error: err.message || 'Falha ao baixar vídeo VSL.',
      }));
    }
  };

  const openUrl = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const vsl = item.vsl_list?.[0];
    const copySet = item.copies?.[0];

    return (
      <View style={styles.pageCard}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner Image */}
          <View style={styles.imageWrapper}>
            <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
            <View style={styles.imageOverlay} />
            
            <View style={styles.logoBadge}>
              <Image source={{ uri: item.logo_url }} style={styles.logoImage} />
            </View>

            <View style={styles.commissionBadge}>
              <DollarSign size={16} color={COLORS.textDark} />
              <Text style={styles.commissionText}>{item.commission}</Text>
            </View>
          </View>

          {/* Offer Title & Specs */}
          <View style={styles.detailsContainer}>
            <Text style={styles.offerTitle}>{item.name}</Text>
            <Text style={styles.offerDescription}>{item.description}</Text>

            {/* Quick Action Grid Buttons */}
            <View style={styles.buttonsContainer}>
              {vsl && (
                <>
                  <LuxuryButton
                    title="▶ Assistir VSL"
                    onPress={() => {}}
                    variant="gold"
                    style={styles.fullBtn}
                  />
                  <LuxuryButton
                    title={`⬇ Baixar VSL (${vsl.resolution} • ${vsl.file_size} • MP4)`}
                    onPress={() => handleDownloadVSL(vsl)}
                    variant="outline"
                    icon={<Download size={18} color={COLORS.gold} />}
                    style={styles.fullBtn}
                  />
                </>
              )}

              <View style={styles.btnRow}>
                <LuxuryButton
                  title="🎥 Facebook Ads"
                  onPress={() => openUrl(item.facebook_ads_library_url)}
                  variant="outline"
                  icon={<Video size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
                <LuxuryButton
                  title="📚 Ads Library"
                  onPress={() => openUrl(item.facebook_ads_library_url)}
                  variant="outline"
                  icon={<BookOpen size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
              </View>

              <View style={styles.btnRow}>
                <LuxuryButton
                  title="🌐 Site Oficial"
                  onPress={() => openUrl(item.official_site_url)}
                  variant="outline"
                  icon={<Globe size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
                <LuxuryButton
                  title="📄 Landing Page"
                  onPress={() => openUrl(item.landing_page_url)}
                  variant="outline"
                  icon={<FileText size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
              </View>
            </View>

            {/* Embedded VSL Player Section */}
            {vsl && (
              <View style={styles.vslSection}>
                <View style={styles.sectionHeader}>
                  <Play size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>VSL da Oferta ({vsl.title})</Text>
                </View>
                <VSLPlayer videoUrl={vsl.video_url} posterUrl={vsl.thumbnail_url} />
              </View>
            )}

            {/* Target Audience / Público-Alvo Section */}
            {copySet && (
              <View style={styles.targetSection}>
                <View style={styles.sectionHeader}>
                  <Users size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>Público-Alvo Recomendado</Text>
                </View>

                <View style={styles.targetGrid}>
                  <View style={styles.targetItem}>
                    <Text style={styles.targetLabel}>Faixa Etária</Text>
                    <Text style={styles.targetValue}>{copySet.target_age}</Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text style={styles.targetLabel}>Gênero</Text>
                    <Text style={styles.targetValue}>{copySet.target_gender}</Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text style={styles.targetLabel}>Localização</Text>
                    <Text style={styles.targetValue}>{copySet.target_country}</Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text style={styles.targetLabel}>Interesses Principais</Text>
                    <Text style={styles.targetValue}>{copySet.target_interests}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Copies Section */}
            {copySet && (
              <View style={styles.copySection}>
                <View style={styles.sectionHeader}>
                  <Copy size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>Copys de Alta Conversão</Text>
                </View>
                <CopyCard copySet={copySet} />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SubscriptionGate>
      <View style={styles.container}>
        <Header subtitle="Swipe de Ofertas Exclusive" />
        
        {/* Swipe Guidance bar */}
        <View style={styles.swipeHintBar}>
          <Text style={styles.swipeHintText}>Deslize para a esquerda para ver a próxima oferta</Text>
          <ChevronRight size={16} color={COLORS.gold} />
        </View>

        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
        />

        {/* Download Progress Modal */}
        <DownloadProgressModal
          visible={downloadModal.visible}
          fileName={downloadModal.fileName}
          progressPercent={downloadModal.progress}
          totalBytesWritten={downloadModal.written}
          totalBytesExpectedToWrite={downloadModal.expected}
          isFinished={downloadModal.isFinished}
          error={downloadModal.error}
          onClose={() => setDownloadModal((prev) => ({ ...prev, visible: false }))}
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
  swipeHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  swipeHintText: {
    color: COLORS.goldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  pageCard: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  imageWrapper: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 10, 15, 0.45)',
  },
  logoBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  commissionBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.goldGlow,
  },
  commissionText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
  detailsContainer: {
    padding: SPACING.md,
  },
  offerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  offerDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  buttonsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  fullBtn: {
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfBtn: {
    flex: 1,
  },
  vslSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.goldLight,
    fontSize: 18,
    fontWeight: '800',
  },
  targetSection: {
    marginBottom: SPACING.xl,
  },
  targetGrid: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: SPACING.sm,
  },
  targetItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingBottom: SPACING.xs,
  },
  targetLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  targetValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  copySection: {
    marginBottom: SPACING.lg,
  },
});
