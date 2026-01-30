import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  if (!currentTrack) return null;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push('/modal')}
      style={[styles.container, { backgroundColor: '#252525', borderTopColor: '#333' }]}
    >
      <View style={styles.content}>
        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
        <View style={styles.info}>
          <Text style={[styles.title, { color: '#fff' }]} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={[styles.artist, { color: '#aaa' }]} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlay(); }} style={styles.playButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Progress Bar could go here */}
      <View style={{ height: 2, backgroundColor: '#333', width: '100%' }}>
         {/* Simple progress bar logic could be added */}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 78, // Adjusted for standard tab bar height + safe area
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 1000, // Ensure it's above other content
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    fontSize: 12,
  },
  playButton: {
    padding: 10,
  },
});
