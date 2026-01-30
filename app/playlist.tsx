import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Track } from '../types';
import { TrackListItem } from '../components/TrackListItem';
import { usePlayerStore } from '../store/playerStore';

export default function PlaylistScreen() {
  const params = useLocalSearchParams();
  const title = typeof params.title === 'string' ? params.title : 'Playlist';
  const dataParam = typeof params.data === 'string' ? params.data : '[]';
  let tracks: Track[] = [];
  try {
    tracks = JSON.parse(decodeURIComponent(dataParam));
  } catch {
    tracks = [];
  }
  const { setQueue } = usePlayerStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.playAll} onPress={() => setQueue(tracks)}>
          <Text style={styles.playAllText}>Play All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrackListItem track={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tracks available</Text>
          </View>
        }
      />
      <View style={{ height: 80 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  playAll: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playAllText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 0,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
