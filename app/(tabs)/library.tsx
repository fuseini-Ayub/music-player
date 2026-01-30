import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../store/playerStore';
import { TrackListItem } from '../../components/TrackListItem';
import { Ionicons } from '@expo/vector-icons';

export default function LibraryScreen() {
  const { library, loadLibrary } = usePlayerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await loadLibrary();
      setLoading(false);
    }
    init();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
        <Text style={styles.subtitle}>{library.length} Offline Tracks</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <FlatList
          data={library}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TrackListItem track={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cloud-download-outline" size={64} color="#444" />
              <Text style={styles.emptyText}>No offline music yet.</Text>
              <Text style={styles.emptySubText}>Download songs to play them offline.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80, // Space for MiniPlayer
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
});
