import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Track } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface Props {
  track: Track;
  onPress?: () => void;
}

export function TrackListItem({ track, onPress }: Props) {
  const { playTrack, currentTrack, isPlaying, isOffline, saveToLibrary, removeFromLibrary } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;
  const isSaved = isOffline(track.id);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      playTrack(track);
    }
  };

  const handleDownloadToggle = async () => {
    setIsDownloading(true);
    if (isSaved) {
      await removeFromLibrary(track.id);
    } else {
      await saveToLibrary(track);
    }
    setIsDownloading(false);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Image source={{ uri: track.artwork }} style={styles.artwork} />
      <View style={styles.info}>
        <Text style={[styles.title, isCurrent && styles.activeText]} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      
      <View style={styles.actions}>
        {isCurrent && (
          <Ionicons name="stats-chart" size={16} color="#0a7ea4" style={{ marginRight: 10 }} />
        )}
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDownloadToggle(); }} disabled={isDownloading}>
          {isDownloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name={isSaved ? "checkmark-circle" : "arrow-down-circle-outline"} 
              size={24} 
              color={isSaved ? "#0a7ea4" : "#888"} 
            />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  activeText: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  artist: {
    fontSize: 14,
    color: '#aaa',
  },
});
