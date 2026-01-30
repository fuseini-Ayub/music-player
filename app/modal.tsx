import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

const { width } = Dimensions.get('window');

export default function PlayerScreen() {
  const { currentTrack, isPlaying, togglePlay, playNext, playPrev, duration, position, seekTo } = usePlayerStore();
  const router = useRouter();
  const [isSliding, setIsSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);

  // Sync slider with position when not sliding
  useEffect(() => {
    if (!isSliding) {
      setSlideValue(position);
    }
  }, [position, isSliding]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>No track playing</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#0a7ea4', marginTop: 20 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
      </View>

      <View style={styles.artworkContainer}>
        <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
      </View>

      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <Ionicons name="heart-outline" size={28} color="#fff" />
      </View>

      <View style={styles.controlsContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1} // Avoid divide by zero
          value={slideValue}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#555"
          thumbTintColor="#fff"
          onSlidingStart={() => setIsSliding(true)}
          onSlidingComplete={(value) => {
            seekTo(value);
            setIsSliding(false);
          }}
          onValueChange={setSlideValue}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(slideValue)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={playPrev}>
            <Ionicons name="play-skip-back" size={35} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext}>
            <Ionicons name="play-skip-forward" size={35} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010', // Darker background for player
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  artwork: {
    width: width - 60,
    height: width - 60,
    borderRadius: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    width: width - 100,
  },
  artist: {
    color: '#aaa',
    fontSize: 18,
  },
  controlsContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeText: {
    color: '#aaa',
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
