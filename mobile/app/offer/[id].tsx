import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOffersStore } from '../../store/useOffersStore';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { LuxuryButton } from '../../components/LuxuryButton';
import { VSLPlayer } from '../../components/VSLPlayer';
import { CopyCard } from '../../components/CopyCard';
import { DownloadProgressModal } from '../../components/DownloadProgressModal';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import {
  ArrowLeft,
  Download,
  Video,
  BookOpen,
  Globe,
  FileText,
  Copy,
  Users,
  DollarSign,
  Play,
} from 'lucide-react-native';
import { getSignedDownloadUrl, downloadFileWithProgress } from '../../services/downloader';

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { offers } = useOffersStore();

  const offer = offers.find((o) => o.id === id) || offers[0];

  const [downloadModal, setDownloadModal] = useState({
    visible: false,
    fileName: '',
    progress: 0,
    isFinished: false,
    error: '',
  });

  const handleDownload = async (fileUrl: string, fileName: string, bucket: string = 'creatives') => {
    try {
      setDownloadModal({
        visible: true,
        fileName,
        progress: 0,
        isFinished: false,
        error: '',
      });

      const signedUrl = await getSignedDownloadUrl(bucket, fileUrl);

      await downloadFileWithProgress(signedUrl, fileName, (prog) => {
        setDownloadModal((prev) => ({
          ...prev,
          progress: prog.progressPercent,
          isFinished: prog.isFinished,
          error: prog.error || '',
        }));
      });
    } catch (err: any) {
      setDownloadModal((prev) => ({
        ...prev,
        error: err.message || 'Erro ao realizar download.',
      }));
    }
  };

  const vsl = offer?.vsl_list?.[0];
  const copySet = offer?.copies?.[0];

  return (
    <SubscriptionGate>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.gold} />
            <Text style={styles.backText}>Voltar às Ofertas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.imageWrapper}>
            <Image source={{ uri: offer.image_url }} style={styles.bannerImage} />
            <View style={styles.logoBadge}>
              <Image source={{ uri: offer.logo_url }} style={styles.logoImage} />
            </View>
            <View style={styles.commissionBadge}>
              <DollarSign size={14} color={COLORS.textDark} />
              <Text style={styles.commissionText}>{offer.commission}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{offer.name}</Text>
            <Text style={styles.description}>{offer.description}</Text>

            {/* Quick Actions */}
            <View style={styles.actionGrid}>
              {vsl && (
                <LuxuryButton
                  title={`⬇ Baixar VSL (${vsl.resolution} • ${vsl.file_size})`}
                  onPress={() => handleDownload(vsl.video_url, `${vsl.title}.mp4`, 'vsl-videos')}
                  variant="gold"
                  icon={<Download size={18} color={COLORS.textDark} />}
                  style={styles.fullWidthBtn}
                />
              )}

              <View style={styles.btnRow}>
                <LuxuryButton
                  title="🎥 FB Ads Videos"
                  onPress={() => Linking.openURL(offer.facebook_ads_library_url || '#')}
                  variant="outline"
                  icon={<Video size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
                <LuxuryButton
                  title="📚 Ads Library"
                  onPress={() => Linking.openURL(offer.facebook_ads_library_url || '#')}
                  variant="outline"
                  icon={<BookOpen size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
              </View>

              <View style={styles.btnRow}>
                <LuxuryButton
                  title="🌐 Site Oficial"
                  onPress={() => Linking.openURL(offer.official_site_url || '#')}
                  variant="outline"
                  icon={<Globe size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
                <LuxuryButton
                  title="📄 Landing Page"
                  onPress={() => Linking.openURL(offer.landing_page_url || '#')}
                  variant="outline"
                  icon={<FileText size={16} color={COLORS.gold} />}
                  style={styles.halfBtn}
                />
              </View>
            </View>

            {/* VSL Streaming Player */}
            {vsl && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Play size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>Assistir VSL Online</Text>
                </View>
                <VSLPlayer videoUrl={vsl.video_url} posterUrl={vsl.thumbnail_url} />
              </View>
            )}

            {/* Creatives Downloads */}
            {offer.creatives && offer.creatives.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Download size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>Download dos Criativos & Arquivos</Text>
                </View>
                {offer.creatives.map((cr) => (
                  <View key={cr.id} style={styles.creativeItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.creativeTitle}>{cr.title}</Text>
                      <Text style={styles.creativeMeta}>
                        Tamanho: {cr.file_size} • Formato: {cr.file_type.toUpperCase()}
                      </Text>
                    </View>
                    <LuxuryButton
                      title="Baixar"
                      onPress={() => handleDownload(cr.file_url, cr.title, 'creatives')}
                      variant="outline"
                      style={{ height: 36, paddingHorizontal: 12 }}
                      textStyle={{ fontSize: 12 }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Copys Section */}
            {copySet && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Copy size={20} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>Copys de Alta Conversão</Text>
                </View>
                <CopyCard copySet={copySet} />
              </View>
            )}
          </View>
        </ScrollView>

        <DownloadProgressModal
          visible={downloadModal.visible}
          fileName={downloadModal.fileName}
          progressPercent={downloadModal.progress}
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
  headerBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  logoBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 3,
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
  },
  commissionText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '900',
  },
  body: {
    padding: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  fullWidthBtn: {
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfBtn: {
    flex: 1,
  },
  section: {
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
    fontSize: 17,
    fontWeight: '800',
  },
  creativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  creativeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  creativeMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
