import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Play } from 'lucide-react-native';

interface VSLPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
}

export const VSLPlayer: React.FC<VSLPlayerProps> = ({ videoUrl, posterUrl, title }) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: videoUrl }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={(s) => setStatus(() => s)}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        posterSource={{ uri: posterUrl }}
        usePoster={!!posterUrl}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Carregando VSL em Alta Definição...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.goldLight,
    fontSize: 13,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
});
